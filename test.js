let zbox = require('.');

zbox.initEnv();

async function run() {
    console.log(await zbox.Repo.exists("mem://foo"));

    let repo = await zbox.openRepo("mem://foo", "pwd", {
        opsLimit: zbox.OpsLimit.Interactive,
        memLimit: zbox.MemLimit.Interactive,
        cipher: zbox.Cipher.Aes,
        create: true
    });

    let info = repo.info();
    console.log(info);

    let file = await repo.openFile("/file", {
        write: true,
        create: true
    });
    const buf = new Uint8Array([2, 1, 3]);
    //const buf = Buffer.alloc(3, 1);
    await file.writeOnce(buf);
    console.log(file.currVersion());
    console.log(file.metadata());
    console.log(file.history());
    file.close();

    /*let wtr = file.writeStream();
    wtr.write(buf);
    wtr.end(() => {
        file.close()
            .then(() => repo.openFile("/file", { read: true }))
            .then((file2) => file2.readAll())
            .then((buf2) => console.log(new Uint8Array(buf2)))
            .then(() => repo.close());
    });*/
    //await file.close();

    /*let file2 = await repo.openFile("/file", { read: true });
    let buf2 = await file2.readAll();
    console.log(new Uint8Array(buf2));
    file2.close();*/

    let file2 = await repo.openFile("/file", { read: true });
    let rdr = file2.readStream();
    rdr.on('data', (chunk) => {
        console.log(chunk);
    });
    rdr.on('end', () => {
        repo.close();
    });

    //await repo.close();

    console.log('done');
}

run();
