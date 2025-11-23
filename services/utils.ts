export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const extractColorsFromImage = (imageSrc: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('#2563eb');
        return;
      }
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let r = 0, g = 0, b = 0, count = 0;
      
      // Sample every 10th pixel for performance
      for (let i = 0; i < imageData.length; i += 40) {
        if (imageData[i + 3] > 128) { // Ignore transparent
          r += imageData[i];
          g += imageData[i + 1];
          b += imageData[i + 2];
          count++;
        }
      }
      
      if (count === 0) {
        resolve('#2563eb');
        return;
      }

      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);

      const toHex = (c: number) => {
        const hex = c.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };

      resolve(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
    };
    img.onerror = () => resolve('#2563eb');
  });
};

export const fetchCNPJData = async (cnpj: string) => {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  if (cleanCNPJ.length !== 14) return null;
  
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
    if (!response.ok) throw new Error('CNPJ fetch failed');
    const data = await response.json();
    return {
      name: data.razao_social || data.nome_fantasia,
      email: data.email || '',
      phone: data.ddd_telefone_1 || '',
      address: {
        cep: data.cep,
        street: data.logradouro,
        number: data.numero,
        complement: data.complemento,
        neighborhood: data.bairro,
        city: data.municipio,
        state: data.uf,
      }
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};

// Heuristic to estimate distance between two Brazilian CEPs
// Uses first digit to determine region approx.
export const calculateDistanceMock = (cep1: string, cep2: string): number => {
  const c1 = parseInt(cep1.replace(/\D/g, '').substring(0, 5));
  const c2 = parseInt(cep2.replace(/\D/g, '').substring(0, 5));
  
  if (isNaN(c1) || isNaN(c2)) return 0;

  // Simple diff mock simulation
  const diff = Math.abs(c1 - c2);
  let dist = Math.floor(diff / 100);
  
  // Minimal realistic distance check
  if (cep1.substring(0,2) === cep2.substring(0,2)) return Math.max(15, Math.random() * 50); // Same region
  
  return Math.max(50, dist);
};
