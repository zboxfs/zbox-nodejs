#[macro_use]
extern crate neon;
extern crate zbox;

use std::error::Error as StdError;
use std::io::{Read, Seek, SeekFrom, Write};
use std::sync::{Arc, Mutex};
use std::time::SystemTime;

use neon::prelude::*;

use zbox::{
    init_env as zbox_init_env, Cipher, DirEntry, Error, File, MemLimit,
    Metadata, OpenOptions, OpsLimit, Repo, RepoOpener, Result, Version,
    VersionReader,
};

type Wrapper<T> = Arc<Mutex<Option<Box<T>>>>;

#[derive(Clone)]
pub struct RepoWrapper(Wrapper<Repo>);

#[derive(Clone)]
pub struct FileWrapper(Wrapper<File>);

#[derive(Clone)]
pub struct VersionReaderWrapper(Wrapper<VersionReader>);

#[inline]
fn time_to_f64(t: SystemTime) -> f64 {
    t.duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs() as f64
}

#[inline]
fn error_string(err: Error) -> String {
    let desc = err.description().to_owned();
    let code: i32 = err.into();
    format!("ZboxFS({}): {}", code, desc)
}

#[allow(dead_code)]
fn init_env(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    zbox_init_env();
    Ok(cx.undefined())
}

#[allow(dead_code)]
fn open_repo(mut cx: FunctionContext) -> JsResult<JsNumber> {
    let args = cx.argument::<JsObject>(0)?;

    let uri = args.get(&mut cx, "uri")?
        .downcast_or_throw::<JsString, FunctionContext>(&mut cx)?.value();
    let pwd = args.get(&mut cx, "pwd")?
        .downcast_or_throw::<JsString, FunctionContext>(&mut cx)?.value();
    let opts = args.get(&mut cx, "opts")?
        .downcast_or_throw::<JsObject, FunctionContext>(&mut cx)?;

    let mut opener = RepoOpener::new();
    if let Ok(limit) = opts.get(&mut cx, "opsLimit")?.downcast::<JsNumber>() {
        opener.ops_limit(OpsLimit::from(limit.value() as i32));
    }
    if let Ok(limit) = opts.get(&mut cx, "memLimit")?.downcast::<JsNumber>() {
        opener.mem_limit(MemLimit::from(limit.value() as i32));
    }
    if let Ok(cipher) = opts.get(&mut cx, "cipher")?.downcast::<JsNumber>() {
        opener.cipher(Cipher::from(cipher.value() as i32));
    }
    if let Ok(create) = opts.get(&mut cx, "create")?.downcast::<JsBoolean>() {
        opener.create(create.value());
    }
    if let Ok(create_new) =
        opts.get(&mut cx, "createNew")?.downcast::<JsBoolean>()
    {
        opener.create_new(create_new.value());
    }
    if let Ok(compress) = opts.get(&mut cx, "compress")?.downcast::<JsBoolean>()
    {
        opener.compress(compress.value());
    }
    if let Ok(limit) = opts.get(&mut cx, "versionLimit")?.downcast::<JsNumber>()
    {
        opener.version_limit(limit.value() as u8);
    }
    if let Ok(dedup) = opts.get(&mut cx, "dedupChunk")?.downcast::<JsBoolean>()
    {
        opener.dedup_chunk(dedup.value());
    }
    if let Ok(read_only) =
        opts.get(&mut cx, "readOnly")?.downcast::<JsBoolean>()
    {
        opener.read_only(read_only.value());
    }

    opener.open(&uri, &pwd)
        .or_else(|err| cx.throw_error(error_string(err)))
        .map(|repo| {
            let ptr_num = Box::into_raw(Box::new(repo)) as i64;
            cx.number(ptr_num as f64)
        })
}

macro_rules! async_task {
    (
        struct $cls:ident {
            $($field:ident: $field_type:ty,)*
        }
        output = $output:ty,
        js_event = $js_event:ty,
        perform($self:ident) $perform:block
        complete($cx:ident, $ret:ident) $complete:block
    ) => {
        struct $cls {
            $($field: $field_type,)*
        }

        impl Task for $cls {
                type Output = $output;
                type Error = Error;
                type JsEvent = $js_event;

                fn perform(&$self) -> Result<Self::Output> $perform

                fn complete(self,
                            mut $cx: TaskContext,
                            result: Result<Self::Output>
                            ) -> JsResult<Self::JsEvent>
                {
                    result
                        .or_else(|err| $cx.throw_error(error_string(err)))
                        .and_then(|$ret| $complete)
                }
        }
    };
}

macro_rules! repo_async_task {
    (
        struct $cls:ident {
            $($field:ident: $field_type:ty,)*
        }
        output = $output:ty,
        js_event = $js_event:ty,
        perform($self:ident, $repo:ident) $perform:block
        complete($cx:ident, $ret:ident) $complete:block
    ) => {
        async_task!{
            struct $cls {
                repo: RepoWrapper,
                $($field: $field_type,)*
            }

            output = $output,
            js_event = $js_event,

            perform($self) {
                match *$self.repo.0.lock().unwrap() {
                    Some(ref mut $repo) => $perform,
                    None => Err(Error::RepoClosed),
                }
            }

            complete($cx, $ret) $complete
        }
    }
}

#[allow(dead_code)]
fn repo_exists(mut cx: FunctionContext) -> JsResult<JsBoolean> {
    let uri = cx.argument::<JsString>(0)?.value();
    Repo::exists(&uri)
        .or_else(|err| cx.throw_error(error_string(err)))
        .and_then(|result| {
            Ok(cx.boolean(result))
        })
}

async_task! {
    struct RepoRepairSuperBlkTask {
        uri: String,
        pwd: String,
    }

    output = (),
    js_event = JsUndefined,

    perform(self) {
        Repo::repair_super_block(&self.uri, &self.pwd)
    }

    complete(cx, _ret) {
        Ok(cx.undefined())
    }
}

#[allow(dead_code)]
fn repo_repair_super_block(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let uri = cx.argument::<JsString>(0)?.value();
    let pwd = cx.argument::<JsString>(1)?.value();
    let callback = cx.argument::<JsFunction>(2)?;
    let task = RepoRepairSuperBlkTask { uri, pwd };
    task.schedule(callback);
    Ok(cx.undefined())
}

repo_async_task! {
    struct RepoResetPwdTask {
        old_pwd: String,
        new_pwd: String,
        ops_limit: OpsLimit,
        mem_limit: MemLimit,
    }

    output = (),
    js_event = JsUndefined,

    perform(self, repo) {
        repo.reset_password(&self.old_pwd,
                            &self.new_pwd,
                            self.ops_limit,
                            self.mem_limit)
    }

    complete(cx, _ret) {
        Ok(cx.undefined())
    }
}

repo_async_task! {
    struct RepoPathExistsTask {
        path: String,
    }

    output = bool,
    js_event = JsBoolean,

    perform(self, repo) {
        repo.path_exists(&self.path)
    }

    complete(cx, ret) {
        Ok(cx.boolean(ret))
    }
}

fn metadata_to_js_obj<'a>(
    cx: &mut TaskContext<'a>,
    md: Metadata,
) -> Handle<'a, JsObject> {
    let meta = JsObject::new(cx);
    let val: String = md.file_type().into();
    let val = cx.string(val);
    meta.set(cx, "fileType", val).unwrap();
    let val = cx.number(md.content_len() as f64);
    meta.set(cx, "contentLen", val).unwrap();
    let val = cx.number(md.curr_version() as f64);
    meta.set(cx, "currVersion", val).unwrap();
    let val = cx.number(time_to_f64(md.created_at()));
    meta.set(cx, "createdAt", val).unwrap();
    let val = cx.number(time_to_f64(md.modified_at()));
    meta.set(cx, "modifiedAt", val).unwrap();
    meta
}

repo_async_task! {
    struct RepoReadDirTask {
        path: String,
    }

    output = Vec<DirEntry>,
    js_event = JsArray,

    perform(self, repo) {
        repo.read_dir(&self.path)
    }

    complete(cx, ret) {
        let js_array = JsArray::new(&mut cx, ret.len() as u32);
        for (i, ent) in ret.iter().enumerate() {
            let js_ent = JsObject::new(&mut cx);

            let path = cx.string(ent.path().to_str().unwrap().to_owned());
            let file_name = cx.string(ent.file_name().to_owned());
            js_ent.set(&mut cx, "path", path).unwrap();
            js_ent.set(&mut cx, "fileName", file_name).unwrap();
            let meta = metadata_to_js_obj(&mut cx, ent.metadata());
            js_ent.set(&mut cx, "metadata", meta).unwrap();

            js_array.set(&mut cx, i as u32, js_ent).unwrap();
        }
        Ok(js_array)
    }
}

repo_async_task! {
    struct RepoMetadataTask {
        path: String,
    }

    output = Metadata,
    js_event = JsObject,

    perform(self, repo) {
        repo.metadata(&self.path)
    }

    complete(cx, ret) {
        let meta = metadata_to_js_obj(&mut cx, ret);
        Ok(meta)
    }
}

repo_async_task! {
    struct RepoHistoryTask {
        path: String,
    }

    output = Vec<Version>,
    js_event = JsArray,

    perform(self, repo) {
        repo.history(&self.path)
    }

    complete(cx, ret) {
        let js_array = JsArray::new(&mut cx, ret.len() as u32);
        for (i, version) in ret.iter().enumerate() {
            let js_ver = JsObject::new(&mut cx);
            let val = cx.number(version.num() as f64);
            js_ver.set(&mut cx, "num", val).unwrap();
            let val = cx.number(version.content_len() as f64);
            js_ver.set(&mut cx, "contentLen", val).unwrap();
            let val = cx.number(time_to_f64(version.created_at()));
            js_ver.set(&mut cx, "createdAt", val).unwrap();
            js_array.set(&mut cx, i as u32, js_ver).unwrap();
        }
        Ok(js_array)
    }
}

repo_async_task! {
    struct RepoCopyTask {
        from: String,
        to: String,
    }

    output = (),
    js_event = JsUndefined,

    perform(self, repo) {
        repo.copy(&self.from, &self.to)
    }

    complete(cx, _ret) {
        Ok(cx.undefined())
    }
}

repo_async_task! {
    struct RepoRemoveFileTask {
        path: String,
    }

    output = (),
    js_event = JsUndefined,

    perform(self, repo) {
        repo.remove_file(&self.path)
    }

    complete(cx, _ret) {
        Ok(cx.undefined())
    }
}

repo_async_task! {
    struct RepoRemoveDirTask {
        path: String,
        remove_all: bool,
    }

    output = (),
    js_event = JsUndefined,

    perform(self, repo) {
        if self.remove_all {
            repo.remove_dir_all(&self.path)?;
        } else {
            repo.remove_dir(&self.path)?;
        }
        Ok(())
    }

    complete(cx, _ret) {
        Ok(cx.undefined())
    }
}

repo_async_task! {
    struct RepoRenameTask {
        from: String,
        to: String,
    }

    output = (),
    js_event = JsUndefined,

    perform(self, repo) {
        repo.rename(&self.from, &self.to)
    }

    complete(cx, _ret) {
        Ok(cx.undefined())
    }
}

macro_rules! simple_repo_method {
    ($cx:ident, $task_cls:ident) => {{
        let path = $cx.argument::<JsString>(0)?.value();
        let callback = $cx.argument::<JsFunction>(1)?;
        let this = $cx.this();
        {
            let guard = $cx.lock();
            let inner = this.borrow(&guard);
            let task = $task_cls {
                repo: inner.clone(),
                path,
            };
            task.schedule(callback);
        }
        Ok($cx.undefined().upcast())
    }};
}

declare_types! {
    pub class JsRepo for RepoWrapper {
        init(mut cx) {
            let ptr_num = cx.argument::<JsNumber>(0)?.value() as i64;
            let repo = unsafe { Box::from_raw(ptr_num as *mut Repo) };
            Ok(RepoWrapper(Arc::new(Mutex::new(Some(repo)))))
        }

        method close(mut cx) {
            let this = cx.this();
            {
                let guard = cx.lock();
                let wrapper = this.borrow(&guard);
                let mut inner = wrapper.0.lock().unwrap();
                inner.take();
            }
            Ok(cx.undefined().upcast())
        }

        method info(mut cx) {
            let this = cx.this();

            let result = {
                let guard = cx.lock();
                let inner = this.borrow(&guard);
                let wrapper = inner.0.lock().unwrap();
                match *wrapper {
                    Some(ref repo) => repo.info(),
                    None => Err(Error::Closed),
                }
            };
            result
                .or_else(|err| cx.throw_error(error_string(err)))
                .and_then(|info| {
                    let info_obj = JsObject::new(&mut cx);
                    let val = cx.string(info.volume_id().to_string());
                    info_obj.set(&mut cx, "volumeId", val)?;
                    let val = cx.string(info.version());
                    info_obj.set(&mut cx, "version", val)?;
                    let val = cx.string(info.uri());
                    info_obj.set(&mut cx, "uri", val)?;
                    let val = cx.boolean(info.compress());
                    info_obj.set(&mut cx, "compress", val)?;
                    let val = cx.number(info.version_limit());
                    info_obj.set(&mut cx, "versionLimit", val)?;
                    let val = cx.boolean(info.dedup_chunk());
                    info_obj.set(&mut cx, "dedupChunk", val)?;
                    let val = cx.boolean(info.is_read_only());
                    info_obj.set(&mut cx, "readOnly", val)?;
                    let val = cx.number(time_to_f64(info.created_at()));
                    info_obj.set(&mut cx, "ctime", val)?;
                    Ok(info_obj.upcast())
                })
        }

        method resetPassword(mut cx) {
            let old_pwd = cx.argument::<JsString>(0)?.value();
            let new_pwd = cx.argument::<JsString>(1)?.value();
            let ops_limit =
                OpsLimit::from(cx.argument::<JsNumber>(2)?.value() as i32);
            let mem_limit =
                MemLimit::from(cx.argument::<JsNumber>(3)?.value() as i32);
            let callback = cx.argument::<JsFunction>(4)?;
            let this = cx.this();
            {
                let guard = cx.lock();
                let inner = this.borrow(&guard);
                let task = RepoResetPwdTask {
                    repo: inner.clone(),
                    old_pwd,
                    new_pwd,
                    ops_limit,
                    mem_limit };
                task.schedule(callback);
            }
            Ok(cx.undefined().upcast())
        }

        method pathExists(mut cx) {
            simple_repo_method!(cx, RepoPathExistsTask)
        }

        method isFile(mut cx) {
            let path = cx.argument::<JsString>(0)?.value();
            let this = cx.this();

            let result = {
                let guard = cx.lock();
                let wrapper = this.borrow(&guard);
                let mut inner = wrapper.0.lock().unwrap();
                match *inner {
                    Some(ref repo) => repo.is_file(&path),
                    None => Err(Error::RepoClosed),
                }
            };
            result
                .or_else(|err| cx.throw_error(error_string(err)))
                .and_then(|result| {
                    Ok(cx.boolean(result).upcast())
                })
        }

        method isDir(mut cx) {
            let path = cx.argument::<JsString>(0)?.value();
            let this = cx.this();

            let result = {
                let guard = cx.lock();
                let wrapper = this.borrow(&guard);
                let mut inner = wrapper.0.lock().unwrap();
                match *inner {
                    Some(ref repo) => repo.is_dir(&path),
                    None => Err(Error::RepoClosed),
                }
            };
            result
                .or_else(|err| cx.throw_error(error_string(err)))
                .and_then(|result| {
                    Ok(cx.boolean(result).upcast())
                })
        }

        method createFile(mut cx) {
            let path = cx.argument::<JsString>(0)?.value();
            let this = cx.this();

            let result = {
                let guard = cx.lock();
                let wrapper = this.borrow(&guard);
                let mut inner = wrapper.0.lock().unwrap();
                match *inner {
                    Some(ref mut repo) => repo.create_file(&path),
                    None => Err(Error::RepoClosed),
                }
            };
            result
                .or_else(|err| cx.throw_error(error_string(err)))
                .and_then(|file| {
                    let ptr_num = Box::into_raw(Box::new(file)) as i64;
                    Ok(cx.number(ptr_num as f64).upcast())
                })
        }

        method openFile(mut cx) {
            let path = cx.argument::<JsString>(0)?.value();
            let opts = cx.argument::<JsObject>(1)?;
            let this = cx.this();

            let mut options = OpenOptions::new();
            if let Ok(read) = opts.get(&mut cx, "read")?
                .downcast::<JsBoolean>()
            {
                options.read(read.value());
            }
            if let Ok(write) = opts.get(&mut cx, "write")?
                .downcast::<JsBoolean>()
            {
                options.write(write.value());
            }
            if let Ok(append) = opts.get(&mut cx, "append")?
                .downcast::<JsBoolean>()
            {
                options.append(append.value());
            }
            if let Ok(truncate) = opts.get(&mut cx, "truncate")?
                .downcast::<JsBoolean>()
            {
                options.truncate(truncate.value());
            }
            if let Ok(create) = opts.get(&mut cx, "create")?
                .downcast::<JsBoolean>()
            {
                options.create(create.value());
            }
            if let Ok(create_new) = opts.get(&mut cx, "createNew")?
                .downcast::<JsBoolean>()
            {
                options.create_new(create_new.value());
            }
            if let Ok(limit) = opts.get(&mut cx, "versionLimit")?
                .downcast::<JsNumber>()
            {
                options.version_limit(limit.value() as u8);
            }
            if let Ok(dedup) = opts.get(&mut cx, "dedupChunk")?
                .downcast::<JsBoolean>()
            {
                options.dedup_chunk(dedup.value());
            }

            let result = {
                let guard = cx.lock();
                let wrapper = this.borrow(&guard);
                let mut inner = wrapper.0.lock().unwrap();
                match *inner {
                    Some(ref mut repo) => options.open(repo, &path),
                    None => Err(Error::RepoClosed),
                }
            };
            result
                .or_else(|err| cx.throw_error(error_string(err)))
                .and_then(|file| {
                    let ptr_num = Box::into_raw(Box::new(file)) as i64;
                    Ok(cx.number(ptr_num as f64).upcast())
                })
        }

        method createDir(mut cx) {
            let path = cx.argument::<JsString>(0)?.value();
            let this = cx.this();

            let result = {
                let guard = cx.lock();
                let wrapper = this.borrow(&guard);
                let mut inner = wrapper.0.lock().unwrap();
                match *inner {
                    Some(ref mut repo) => repo.create_dir(&path),
                    None => Err(Error::RepoClosed),
                }
            };
            result
                .or_else(|err| cx.throw_error(error_string(err)))
                .and_then(|_| Ok(cx.undefined().upcast()))
        }

        method createDirAll(mut cx) {
            let path = cx.argument::<JsString>(0)?.value();
            let this = cx.this();

            let result = {
                let guard = cx.lock();
                let wrapper = this.borrow(&guard);
                let mut inner = wrapper.0.lock().unwrap();
                match *inner {
                    Some(ref mut repo) => repo.create_dir_all(&path),
                    None => Err(Error::RepoClosed),
                }
            };
            result
                .or_else(|err| cx.throw_error(error_string(err)))
                .and_then(|_| Ok(cx.undefined().upcast()))
        }

        method readDir(mut cx) {
            simple_repo_method!(cx, RepoReadDirTask)
        }

        method metadata(mut cx) {
            simple_repo_method!(cx, RepoMetadataTask)
        }

        method history(mut cx) {
            simple_repo_method!(cx, RepoHistoryTask)
        }

        method copy(mut cx) {
            let from = cx.argument::<JsString>(0)?.value();
            let to = cx.argument::<JsString>(1)?.value();
            let callback = cx.argument::<JsFunction>(1)?;
            let this = cx.this();
            {
                let guard = cx.lock();
                let inner = this.borrow(&guard);
                let task = RepoCopyTask { repo: inner.clone(), from, to };
                task.schedule(callback);
            }
            Ok(cx.undefined().upcast())
        }

        method removeFile(mut cx) {
            simple_repo_method!(cx, RepoRemoveFileTask)
        }

        method removeDir(mut cx) {
            let path = cx.argument::<JsString>(0)?.value();
            let callback = cx.argument::<JsFunction>(1)?;
            let this = cx.this();
            {
                let guard = cx.lock();
                let inner = this.borrow(&guard);
                let task = RepoRemoveDirTask {
                    repo: inner.clone(),
                    path,
                    remove_all: false
                };
                task.schedule(callback);
            }
            Ok(cx.undefined().upcast())
        }

        method removeDirAll(mut cx) {
            let path = cx.argument::<JsString>(0)?.value();
            let callback = cx.argument::<JsFunction>(1)?;
            let this = cx.this();
            {
                let guard = cx.lock();
                let inner = this.borrow(&guard);
                let task = RepoRemoveDirTask {
                    repo: inner.clone(),
                    path,
                    remove_all: true
                };
                task.schedule(callback);
            }
            Ok(cx.undefined().upcast())
        }

        method rename(mut cx) {
            let from = cx.argument::<JsString>(0)?.value();
            let to = cx.argument::<JsString>(1)?.value();
            let callback = cx.argument::<JsFunction>(1)?;
            let this = cx.this();
            {
                let guard = cx.lock();
                let inner = this.borrow(&guard);
                let task = RepoRenameTask { repo: inner.clone(), from, to };
                task.schedule(callback);
            }
            Ok(cx.undefined().upcast())
        }
    }

    pub class JsFile for FileWrapper {
        init(mut cx) {
            let ptr_num = cx.argument::<JsNumber>(0)?.value() as i64;
            let file = unsafe { Box::from_raw(ptr_num as *mut File) };
            Ok(FileWrapper(Arc::new(Mutex::new(Some(file)))))
        }

        method close(mut cx) {
            let this = cx.this();
            {
                let guard = cx.lock();
                let inner = this.borrow(&guard);
                let mut wrapper = inner.0.lock().unwrap();
                wrapper.take();
            }
            Ok(cx.undefined().upcast())
        }

        method read(mut cx) {
            let buf = cx.argument::<JsArrayBuffer>(0)?;
            let buf_offset = cx.argument::<JsNumber>(1)?.value() as usize;
            let buf_len = cx.argument::<JsNumber>(2)?.value() as usize;
            let this = cx.this();

            let result = {
                let guard = cx.lock();
                let inner = this.borrow(&guard);
                cx.borrow(&buf, |data| {
                    let slice = data.as_mut_slice::<u8>();
                    match *inner.0.lock().unwrap() {
                        Some(ref mut file) => file
                            .read(&mut slice[buf_offset..buf_offset + buf_len])
                            .map_err(Error::from),
                        None => Err(Error::Closed),
                    }
                })
            };
            result
                .or_else(|err| cx.throw_error(error_string(err)))
                .and_then(|read| Ok(cx.number(read as f64).upcast()))
        }

        method readAll(mut cx) {
            let this = cx.this();
            let mut buf = Vec::new();

            let result = {
                let guard = cx.lock();
                let wrapper = this.borrow(&guard);
                let mut inner = wrapper.0.lock().unwrap();
                match *inner {
                    Some(ref mut file) => file
                        .read_to_end(&mut buf)
                        .map_err(Error::from),
                    None => Err(Error::Closed),
                }
            };
            result
                .or_else(|err| cx.throw_error(error_string(err)))
                .and_then(|_| {
                    let ret = cx.array_buffer(buf.len() as u32)?;
                    cx.borrow(&ret, |buf_data| {
                        let slice = buf_data.as_mut_slice::<u8>();
                        slice.copy_from_slice(&buf[..]);
                    });
                    Ok(ret.upcast())
                })
        }

        method write(mut cx) {
            let buf = cx.argument::<JsArrayBuffer>(0)?;
            let buf_offset = cx.argument::<JsNumber>(1)?.value() as usize;
            let buf_len = cx.argument::<JsNumber>(2)?.value() as usize;
            let this = cx.this();

            let result = {
                let guard = cx.lock();
                let inner = this.borrow(&guard);
                cx.borrow(&buf, |data| {
                    let slice = data.as_slice::<u8>();
                    match *inner.0.lock().unwrap() {
                        Some(ref mut file) => file
                            .write(&slice[buf_offset..buf_offset + buf_len])
                            .map_err(Error::from),
                        None => Err(Error::Closed),
                    }
                })
            };
            result
                .or_else(|err| cx.throw_error(error_string(err)))
                .and_then(|written| Ok(cx.number(written as f64).upcast()))
        }

        method finish(mut cx) {
            let this = cx.this();

            let result = {
                let guard = cx.lock();
                let inner = this.borrow(&guard);
                let mut wrapper = inner.0.lock().unwrap();
                match *wrapper {
                    Some(ref mut file) => file.finish(),
                    None => Err(Error::Closed),
                }
            };
            result
                .or_else(|err| cx.throw_error(error_string(err)))
                .and_then(|_| Ok(cx.undefined().upcast()))
        }

        method writeOnce(mut cx) {
            let buf = cx.argument::<JsArrayBuffer>(0)?;
            let buf_offset = cx.argument::<JsNumber>(1)?.value() as usize;
            let buf_len = cx.argument::<JsNumber>(2)?.value() as usize;
            let this = cx.this();

            let result = {
                let guard = cx.lock();
                let inner = this.borrow(&guard);
                cx.borrow(&buf, |data| {
                    let slice = data.as_slice::<u8>();
                    match *inner.0.lock().unwrap() {
                        Some(ref mut file) => file
                            .write_once(&slice[buf_offset..buf_offset + buf_len])
                            .map_err(Error::from),
                        None => Err(Error::Closed),
                    }
                })
            };
            result
                .or_else(|err| cx.throw_error(error_string(err)))
                .and_then(|_| Ok(cx.undefined().upcast()))
        }

        method seek(mut cx) {
            let from = cx.argument::<JsNumber>(0)?.value() as u32;
            let offset = cx.argument::<JsNumber>(1)?.value();
            let this = cx.this();

            let result = {
                let guard = cx.lock();
                let inner = this.borrow(&guard);
                let mut wrapper = inner.0.lock().unwrap();
                match *wrapper {
                    Some(ref mut file) => {
                        match from {
                            0 => Ok(SeekFrom::Start(offset as u64)),
                            1 => Ok(SeekFrom::End(offset as i64)),
                            2 => Ok(SeekFrom::Current(offset as i64)),
                            _ => Err(Error::InvalidArgument),
                        }.and_then(|pos| file.seek(pos).map_err(Error::from))
                    }
                    None => Err(Error::Closed),
                }
            };
            result
                .or_else(|err| cx.throw_error(error_string(err)))
                .and_then(|new_pos| Ok(cx.number(new_pos as f64).upcast()))
        }

        method setLen(mut cx) {
            let len = cx.argument::<JsNumber>(0)?.value() as usize;
            let this = cx.this();

            let result = {
                let guard = cx.lock();
                let inner = this.borrow(&guard);
                let mut wrapper = inner.0.lock().unwrap();
                match *wrapper {
                    Some(ref mut file) => file.set_len(len),
                    None => Err(Error::Closed),
                }
            };
            result
                .or_else(|err| cx.throw_error(error_string(err)))
                .and_then(|_| Ok(cx.undefined().upcast()))
        }

        method currVersion(mut cx) {
            let this = cx.this();

            let result = {
                let guard = cx.lock();
                let inner = this.borrow(&guard);
                let wrapper = inner.0.lock().unwrap();
                match *wrapper {
                    Some(ref file) => file.curr_version(),
                    None => Err(Error::Closed),
                }
            };
            result
                .or_else(|err| cx.throw_error(error_string(err)))
                .and_then(|ver| Ok(cx.number(ver as f64).upcast()))
        }

        method versionReader(mut cx) {
            let ver_num = cx.argument::<JsNumber>(0)?.value() as usize;
            let this = cx.this();

            let result = {
                let guard = cx.lock();
                let inner = this.borrow(&guard);
                let wrapper = inner.0.lock().unwrap();
                match *wrapper {
                    Some(ref file) => file
                        .version_reader(ver_num)
                        .map(|rdr| Box::into_raw(Box::new(rdr)) as i64),
                    None => Err(Error::Closed),
                }
            };
            result
                .or_else(|err| cx.throw_error(error_string(err)))
                .and_then(|ptr_num| Ok(cx.number(ptr_num as f64).upcast()))
        }

        method metadata(mut cx) {
            let this = cx.this();

            let result = {
                let guard = cx.lock();
                let inner = this.borrow(&guard);
                let mut wrapper = inner.0.lock().unwrap();
                match *wrapper {
                    Some(ref file) => file.metadata(),
                    None => Err(Error::Closed),
                }
            };
            result
                .or_else(|err| cx.throw_error(error_string(err)))
                .and_then(|md| {
                    let meta = JsObject::new(&mut cx);
                    let val: String = md.file_type().into();
                    let val = cx.string(val);
                    meta.set(&mut cx, "fileType", val).unwrap();
                    let val = cx.number(md.content_len() as f64);
                    meta.set(&mut cx, "contentLen", val).unwrap();
                    let val = cx.number(md.curr_version() as f64);
                    meta.set(&mut cx, "currVersion", val).unwrap();
                    let val = cx.number(time_to_f64(md.created_at()));
                    meta.set(&mut cx, "createdAt", val).unwrap();
                    let val = cx.number(time_to_f64(md.modified_at()));
                    meta.set(&mut cx, "modifiedAt", val).unwrap();
                    Ok(meta.upcast())
                })
        }

        method history(mut cx) {
            let this = cx.this();

            let result = {
                let guard = cx.lock();
                let inner = this.borrow(&guard);
                let mut wrapper = inner.0.lock().unwrap();
                match *wrapper {
                    Some(ref file) => file.history(),
                    None => Err(Error::Closed),
                }
            };
            result
                .or_else(|err| cx.throw_error(error_string(err)))
                .and_then(|hist| {
                    let js_array = JsArray::new(&mut cx, hist.len() as u32);
                    for (i, version) in hist.iter().enumerate() {
                        let js_ver = JsObject::new(&mut cx);
                        let val = cx.number(version.num() as f64);
                        js_ver.set(&mut cx, "num", val).unwrap();
                        let val = cx.number(version.content_len() as f64);
                        js_ver.set(&mut cx, "contentLen", val).unwrap();
                        let val = cx.number(time_to_f64(version.created_at()));
                        js_ver.set(&mut cx, "createdAt", val).unwrap();
                        js_array.set(&mut cx, i as u32, js_ver).unwrap();
                    }
                    Ok(js_array.upcast())
                })
        }
    }

    pub class JsVersionReader for VersionReaderWrapper {
        init(mut cx) {
            let ptr_num = cx.argument::<JsNumber>(0)?.value() as i64;
            let vrdr = unsafe { Box::from_raw(ptr_num as *mut VersionReader) };
            Ok(VersionReaderWrapper(Arc::new(Mutex::new(Some(vrdr)))))
        }

        method close(mut cx) {
            let this = cx.this();
            {
                let guard = cx.lock();
                let inner = this.borrow(&guard);
                let mut wrapper = inner.0.lock().unwrap();
                wrapper.take();
            }
            Ok(cx.undefined().upcast())
        }

        method read(mut cx) {
            let buf = cx.argument::<JsArrayBuffer>(0)?;
            let buf_offset = cx.argument::<JsNumber>(1)?.value() as usize;
            let buf_len = cx.argument::<JsNumber>(2)?.value() as usize;
            let this = cx.this();

            let result = {
                let guard = cx.lock();
                let inner = this.borrow(&guard);
                cx.borrow(&buf, |data| {
                    let slice = data.as_mut_slice::<u8>();
                    match *inner.0.lock().unwrap() {
                        Some(ref mut vrdr) => vrdr
                            .read(&mut slice[buf_offset..buf_offset + buf_len])
                            .map_err(Error::from),
                        None => Err(Error::Closed),
                    }
                })
            };
            result
                .or_else(|err| cx.throw_error(error_string(err)))
                .and_then(|read| Ok(cx.number(read as f64).upcast()))
        }

        method readAll(mut cx) {
            let this = cx.this();
            let mut buf = Vec::new();

            let result = {
                let guard = cx.lock();
                let wrapper = this.borrow(&guard);
                let mut inner = wrapper.0.lock().unwrap();
                match *inner {
                    Some(ref mut vrdr) => vrdr
                        .read_to_end(&mut buf)
                        .map_err(Error::from),
                    None => Err(Error::Closed),
                }
            };
            result
                .or_else(|err| cx.throw_error(error_string(err)))
                .and_then(|_| {
                    let ret = cx.array_buffer(buf.len() as u32)?;
                    cx.borrow(&ret, |buf_data| {
                        let slice = buf_data.as_mut_slice::<u8>();
                        slice.copy_from_slice(&buf[..]);
                    });
                    Ok(ret.upcast())
                })
        }

        method seek(mut cx) {
            let from = cx.argument::<JsNumber>(0)?.value() as u32;
            let offset = cx.argument::<JsNumber>(1)?.value();
            let this = cx.this();

            let result = {
                let guard = cx.lock();
                let inner = this.borrow(&guard);
                let mut wrapper = inner.0.lock().unwrap();
                match *wrapper {
                    Some(ref mut vrdr) => {
                        match from {
                            0 => Ok(SeekFrom::Start(offset as u64)),
                            1 => Ok(SeekFrom::End(offset as i64)),
                            2 => Ok(SeekFrom::Current(offset as i64)),
                            _ => Err(Error::InvalidArgument),
                        }.and_then(|pos| vrdr.seek(pos).map_err(Error::from))
                    }
                    None => Err(Error::Closed),
                }
            };
            result
                .or_else(|err| cx.throw_error(error_string(err)))
                .and_then(|new_pos| Ok(cx.number(new_pos as f64).upcast()))
        }
    }
}

register_module!(mut cx, {
    cx.export_function("initEnv", init_env)?;
    cx.export_function("openRepo", open_repo)?;
    cx.export_function("repoExists", repo_exists)?;
    cx.export_function("repoRepairSuperBlock", repo_repair_super_block)?;
    cx.export_class::<JsRepo>("Repo")?;
    cx.export_class::<JsFile>("File")?;
    cx.export_class::<JsVersionReader>("VersionReader")?;
    Ok(())
});
