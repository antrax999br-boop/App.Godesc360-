import { readFileSync, writeFileSync } from 'fs';
const target = 'c:/Users/HunterFPS1/Desktop/godesc-service-desk/src/components/ModalDetalheChamado.tsx';
const template = readFileSync('c:/Users/HunterFPS1/Desktop/godesc-service-desk/modal_template.txt', 'utf8');
writeFileSync(target, template, 'utf8');
console.log('Done. Written', template.length, 'bytes');
