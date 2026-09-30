target = r'c:\Users\HunterFPS1\Desktop\godesc-service-desk\src\components\ModalDetalheChamado.tsx'
with open(r'c:\Users\HunterFPS1\Desktop\godesc-service-desk\modal_template.txt', 'r', encoding='utf-8') as f:
    content = f.read()
with open(target, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'Written: {len(content)} bytes')
