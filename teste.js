const fs = require('fs');
const path = require('path');

async function testarIA() {
  try {
    const filePath = path.join(__dirname, 'foto.jpg');
    
    if (!fs.existsSync(filePath)) {
      console.log('❌ ERRO: Não encontrei o arquivo "foto.jpg" nesta pasta.');
      console.log('Por favor, coloque uma imagem com esse nome na pasta do backend.');
      return;
    }

    const fileBuffer = fs.readFileSync(filePath);
    
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
    formData.append('image', blob, 'foto.jpg');

    console.log('📤 Enviando foto para a IA... aguarde 3 segundos.');
    
    const response = await fetch('http://localhost:3001/reports/analyze', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    console.log('\n✅ SUCESSO! A IA respondeu:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ ERRO AO TESTAR:', error.message);
  }
}

testarIA();