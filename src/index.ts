
import "reflect-metadata";
import { Connection } from "typeorm";
import ConfigDB from "./config/db";
import fs, { lstat } from 'fs';
import path from 'path';
import printer from '@thiagoelg/node-printer'
import { Interchange } from "./models/interchange";

interface IInterchange {
  id?: number;
  invoice?: string;
  isImpreso?: boolean;
  completed?: boolean;
  uploadFileId?: number;
  hash?: string;
  url?: string;
  printerName?: string;
}

let connection: Connection;

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function openConnectionDb(): Promise<any> {
  connection = await ConfigDB();
}


async function closeConnectionDb() {
  await connection.close();
}

const main = async () => {
  await openConnectionDb();

  while (true) {
    
    const resp: IInterchange[] = await connection.query(`
  Select 
    distinct on (i.id)
    i.id,
    i.invoice, 
    i."isImpreso", 
    i.completed,
    ufm.upload_file_id,
    uf.hash,
    uf.url,
    a."printerName"
  from 
    interchanges i,
    upload_file_morph ufm,
    upload_file uf,
    areas a 
  where i.completed = true 
    and i."isImpreso" = false
    and a.id = i.area
    and ufm.related_id = i.id
    and ufm.related_type = 'interchanges'
    and ufm.upload_file_id = uf.id 
  order by i.id desc
  limit 10;
  `)

  console.log(resp)

    
    
    for await (const intercambio of resp) {

      const pathFile = path.resolve(`./uploads/${intercambio.hash}.pdf`);
      console.log(pathFile);
      if (!fs.existsSync(pathFile)) {
        console.log(`El archivo no existe ${pathFile}`);
        break;
      }

      await delay(60000)
      printer.printFile({
       filename: pathFile,
       printer: intercambio.printerName,
       options: {
         copies: 2
       },
       error: (err) => {
         console.log('Error de impresion', err);
       },
       success: async (data) => {
         console.log(data);
         //@ts-ignore
         const jobInfo = printer.getJob(intercambio.printerName!, data);
         //@ts-ignore
         console.log(jobInfo.status.indexOf('PENDING'))
         // @ts-ignore
         if (jobInfo.status.indexOf('PENDING') == 0) {
           {
             console.log('Esperando a que termine la impresion');
             try {
               
               const resp = await connection.getRepository(Interchange).update(intercambio.id!, { isImpreso: true });
               console.log(resp);
               
               console.log(`Termina ejecucion`);
               console.log('Se actualizo el estado del intercambio', intercambio.id);
               
             } catch (error) {
               console.log('Error ejecucion de query',error);
             }
             return;
           }
         }
       }
      })
    }
    
    console.log(new Date().toLocaleTimeString());

    
    await delay(10000);
  }
}

main()