const els = {
  form: document.getElementById('safetyForm'),
  btn: document.getElementById('submitBtn'),
  valMsg: document.getElementById('validation-msg'),
  
  fotoSB: document.getElementById('foto-SB'),
  fotoWP: document.getElementById('foto-WP'),
  previewSB: document.getElementById('preview-SB'),
  previewWP: document.getElementById('preview-WP'),
  
  containerSB: document.getElementById('container-SB'),
  containerWP: document.getElementById('container-WP')
};

flatpickr("#tanggal_pekerjaan", {
  dateFormat: "d/m/Y",
  disableMobile: true
});

let imgSB = null;
let imgWP = null;

const readImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve({ img, src: e.target.result });
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const resetValidationVisuals = () => {
  els.valMsg.classList.add('hidden');
  els.valMsg.innerText = '';
  
  [els.containerSB, els.containerWP].forEach(container => {
    container.classList.remove('border-red-400', 'bg-red-50', 'animate-shake');
    container.classList.add('border-pln-border', 'bg-[#fcfdfd]');
  });
};

const triggerValidationVisuals = (missingSB, missingWP) => {
  els.valMsg.innerText = 'PROSEDUR DITOLAK: Harap unggah seluruh dokumentasi foto yang diwajibkan.';
  els.valMsg.classList.remove('hidden');
  
  if (missingSB) {
    els.containerSB.classList.remove('border-pln-border', 'bg-[#fcfdfd]');
    els.containerSB.classList.add('border-red-400', 'bg-red-50', 'animate-shake');
  }
  
  if (missingWP) {
    els.containerWP.classList.remove('border-pln-border', 'bg-[#fcfdfd]');
    els.containerWP.classList.add('border-red-400', 'bg-red-50', 'animate-shake');
  }
  
  setTimeout(() => {
    els.containerSB.classList.remove('animate-shake');
    els.containerWP.classList.remove('animate-shake');
  }, 500);
};

const handleImageUpload = async (file, previewEl, containerEl, type) => {
  if (!file) return;
  resetValidationVisuals();
  
  try {
    const result = await readImage(file);
    previewEl.src = result.src;
    
    const wrapper = type === 'SB' ? document.getElementById('wrapper-preview-SB') : document.getElementById('wrapper-preview-WP');
    wrapper.classList.remove('hidden');
    
    containerEl.classList.remove('border-red-400', 'bg-red-50');
    containerEl.classList.add('border-pln-border', 'bg-[#fcfdfd]');
    
    if (type === 'SB') imgSB = result.img;
    if (type === 'WP') imgWP = result.img;
  } catch (error) {
    alert('Preview Error');
  }
};

els.fotoSB.addEventListener('change', (e) => handleImageUpload(e.target.files[0], els.previewSB, els.containerSB, 'SB'));
els.fotoWP.addEventListener('change', (e) => handleImageUpload(e.target.files[0], els.previewWP, els.containerWP, 'WP'));

const generateCollage = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  const isLandscapeSB = imgSB.width > imgSB.height;
  const isLandscapeWP = imgWP.width > imgWP.height;

  if (isLandscapeSB && isLandscapeWP) {
    const imgWidth = 1400; 
    
    const heightSB = (imgSB.height / imgSB.width) * imgWidth;
    const heightWP = (imgWP.height / imgWP.width) * imgWidth;
    
    canvas.width = imgWidth;
    canvas.height = heightSB + heightWP;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.drawImage(imgSB, 0, 0, imgWidth, heightSB);
    ctx.drawImage(imgWP, 0, heightSB, imgWidth, heightWP);
    
    ctx.beginPath();
    ctx.moveTo(0, heightSB);
    ctx.lineTo(imgWidth, heightSB);
    ctx.strokeStyle = '#e1e8eb';
    ctx.lineWidth = 6;
    ctx.stroke();

  } 
  else {
    const imgWidth = 1000; 
    
    const heightSB = (imgSB.height / imgSB.width) * imgWidth;
    const heightWP = (imgWP.height / imgWP.width) * imgWidth;
    const canvasHeight = Math.max(heightSB, heightWP);
    
    canvas.width = imgWidth * 2; 
    canvas.height = canvasHeight; 
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const ySB = (canvasHeight - heightSB) / 2;
    ctx.drawImage(imgSB, 0, ySB, imgWidth, heightSB);
    
    const yWP = (canvasHeight - heightWP) / 2;
    ctx.drawImage(imgWP, imgWidth, yWP, imgWidth, heightWP);
    
    ctx.beginPath();
    ctx.moveTo(imgWidth, 0);
    ctx.lineTo(imgWidth, canvasHeight);
    ctx.strokeStyle = '#e1e8eb';
    ctx.lineWidth = 6;
    ctx.stroke();
  }

  return canvas.toDataURL('image/jpeg', 0.85); 
};

els.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  resetValidationVisuals();
  
  if (!imgSB || !imgWP) {
    triggerValidationVisuals(!imgSB, !imgWP);
    const firstMissing = !imgSB ? els.containerSB : els.containerWP;
    firstMissing.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  els.btn.disabled = true;
  els.btn.innerText = 'MENGIRIM LAPORAN...';

  try {
    const payload = {
      nama_pekerjaan: document.getElementById('nama_pekerjaan').value,
      tanggal_pekerjaan: document.getElementById('tanggal_pekerjaan').value,
      lokasi: document.getElementById('lokasi').value,
      tim_pelaksana: document.getElementById('tim_pelaksana').value,
      pengawas_k3: document.getElementById('pengawas_k3').value,
      pengawas_pekerjaan: document.getElementById('pengawas_pekerjaan').value,
      jumlah_pelaksana: document.getElementById('jumlah_pelaksana').value,
      foto_collage: generateCollage()
    };

    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      alert("Laporan berhasil diverifikasi dan dikirim.");
      window.location.reload();
    } else {
      alert("Transmisi gagal. Periksa stabilitas koneksi.");
    }
  } catch (error) {
    alert("Terjadi anomali pada sistem internal.");
  } finally {
    els.btn.disabled = false;
    els.btn.innerText = 'KIRIM LAPORAN INSPEKSI';
  }
});