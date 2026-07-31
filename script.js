let currentStep = 1;
const titles = ['Data Pekerjaan', 'Data Pelaksana', 'Foto Working Permit', 'Foto Safety Briefing'];
const images = { WP: null, SB: null };
let cameraStream = null;

flatpickr("#tanggal_pekerjaan", { dateFormat: "d/m/Y", disableMobile: true });

const updateUI = () => {
  document.querySelectorAll('.step-card').forEach((el, index) => {
    el.classList.toggle('active', index + 1 === currentStep);
  });
  document.getElementById('current-step-indicator').innerText = currentStep;
  document.getElementById('step-title').innerText = titles[currentStep - 1];
  document.getElementById('progress-bar').style.width = `${(currentStep / 4) * 100}%`;
};

const validateStep = (step) => {
  const inputs = document.querySelectorAll(`#step-${step} input[required]`);
  let isValid = true;
  inputs.forEach(input => {
    if (!input.value.trim()) {
      input.classList.add('border-red-500');
      isValid = false;
    } else {
      input.classList.remove('border-red-500');
    }
  });
  
  if (step === 3 && !images.WP) { 
    alert("Harap ambil/pilih foto Working Permit terlebih dahulu!"); 
    return false; 
  }
  return isValid;
};

const nextStep = (targetStep, currentMediaStep) => {
  if (validateStep(currentStep)) {
    stopCamera();
    currentStep = targetStep;
    updateUI();
  } else {
    alert("Harap lengkapi semua kolom yang diwajibkan.");
  }
};

const prevStep = (targetStep) => {
  stopCamera();
  currentStep = targetStep;
  updateUI();
};

const startCamera = async (type) => {
  const video = document.getElementById(`video-${type}`);
  const guide = document.getElementById(`guide-${type}`);
  const ui = document.getElementById(`init-ui-${type}`);
  const snapBtn = document.getElementById(`snap-btn-${type}`);
  
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: "environment" }
    });
    video.srcObject = cameraStream;
    
    ui.classList.add('hidden');
    video.classList.remove('hidden');
    guide.classList.remove('hidden');
    snapBtn.classList.remove('hidden');
  } catch (error) {
    alert("Akses kamera ditolak atau tidak didukung browser ini. Silakan gunakan tombol Galeri.");
  }
};

const stopCamera = () => {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
};

const takeSnapshot = (type) => {
  const video = document.getElementById(`video-${type}`);
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  
  processImageResult(canvas.toDataURL('image/jpeg', 0.9), type);
  stopCamera();
};

const handleFile = (input, type) => {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => processImageResult(e.target.result, type);
    reader.readAsDataURL(input.files[0]);
  }
};

const processImageResult = (dataUrl, type) => {
  const img = new Image();
  img.onload = () => {
    images[type] = img;
    
    document.getElementById(`video-${type}`).classList.add('hidden');
    document.getElementById(`guide-${type}`).classList.add('hidden');
    document.getElementById(`snap-btn-${type}`).classList.add('hidden');
    document.getElementById(`init-ui-${type}`).classList.add('hidden');
    
    const preview = document.getElementById(`preview-${type}`);
    preview.src = dataUrl;
    preview.classList.remove('hidden');
    
    document.getElementById(`retake-btn-${type}`).classList.remove('hidden');
  };
  img.src = dataUrl;
};

const resetMedia = (type) => {
  images[type] = null;
  document.getElementById(`preview-${type}`).classList.add('hidden');
  document.getElementById(`retake-btn-${type}`).classList.add('hidden');
  document.getElementById(`init-ui-${type}`).classList.remove('hidden');
};

const generateCollage = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  const targetWidth = 1200;
  const hSB = (images.SB.height / images.SB.width) * targetWidth;
  const hWP = (images.WP.height / images.WP.width) * targetWidth;
  
  canvas.width = targetWidth;
  canvas.height = hSB + hWP;
  
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.drawImage(images.SB, 0, 0, targetWidth, hSB);
  ctx.drawImage(images.WP, 0, hSB, targetWidth, hWP);
  
  ctx.beginPath();
  ctx.moveTo(0, hSB);
  ctx.lineTo(targetWidth, hSB);
  ctx.strokeStyle = '#e1e8eb';
  ctx.lineWidth = 10;
  ctx.stroke();

  return canvas.toDataURL('image/jpeg', 0.85); 
};

document.getElementById('safetyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!images.SB) { 
    alert("Harap ambil/pilih foto Safety Briefing terlebih dahulu!"); 
    return; 
  }
  
  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.innerText = 'MENGIRIM...';

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
    btn.disabled = false;
    btn.innerText = 'KIRIM LAPORAN ✔';
  }
});