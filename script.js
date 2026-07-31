let currentStep = 1;
const titles = ['Data Pekerjaan', 'Data Pelaksana', 'Foto Working Permit', 'Foto Safety Briefing'];
const images = { WP: null, SB: null };

flatpickr("#tanggal_pekerjaan", { dateFormat: "d/m/Y", disableMobile: true });

const showToast = (message, isError = false) => {
  const toast = document.getElementById('toast');
  toast.innerText = message;
  toast.className = `fixed top-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-xl text-white font-bold text-sm transition-all duration-300 z-50 transform -translate-y-20 opacity-0 pointer-events-none text-center min-w-[280px] ${isError ? 'bg-red-500' : 'bg-green-500'}`;
  
  requestAnimationFrame(() => {
    toast.classList.remove('-translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('-translate-y-20', 'opacity-0');
  }, 3500);
};

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
    showToast("Harap ambil foto Working Permit!", true); 
    return false; 
  }
  return isValid;
};

const nextStep = (targetStep) => {
  if (validateStep(currentStep)) {
    currentStep = targetStep;
    updateUI();
  } else {
    showToast("Harap lengkapi data yang diwajibkan.", true);
  }
};

const prevStep = (targetStep) => {
  currentStep = targetStep;
  updateUI();
};

const handleFile = (input, type) => {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        images[type] = img;
        
        document.getElementById(`init-ui-${type}`).classList.add('hidden');
        
        const preview = document.getElementById(`preview-${type}`);
        preview.src = e.target.result;
        preview.classList.remove('hidden');
        
        document.getElementById(`retake-btn-${type}`).classList.remove('hidden');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
  input.value = '';
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
  
  const isPortraitSB = images.SB.width <= images.SB.height;
  const isPortraitWP = images.WP.width <= images.WP.height;

  if (isPortraitSB && isPortraitWP) {
    const targetWidth = 1200;
    const hSB = (images.SB.height / images.SB.width) * targetWidth;
    const hWP = (images.WP.height / images.WP.width) * targetWidth;
    const canvasHeight = Math.max(hSB, hWP);
    
    canvas.width = targetWidth * 2;
    canvas.height = canvasHeight;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.drawImage(images.SB, 0, (canvasHeight - hSB) / 2, targetWidth, hSB);
    ctx.drawImage(images.WP, targetWidth, (canvasHeight - hWP) / 2, targetWidth, hWP);
    
    ctx.beginPath();
    ctx.moveTo(targetWidth, 0);
    ctx.lineTo(targetWidth, canvasHeight);
    ctx.strokeStyle = '#e1e8eb';
    ctx.lineWidth = 10;
    ctx.stroke();
  } else {
    const targetWidth = 1600;
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
    ctx.lineWidth = 16;
    ctx.stroke();
  }

  return canvas.toDataURL('image/jpeg', 0.92); 
};

document.getElementById('safetyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!images.SB) { 
    showToast("Harap ambil foto Safety Briefing!", true); 
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
      showToast("Laporan berhasil dikirim!", false);
      setTimeout(() => window.location.reload(), 2000);
    } else {
      showToast("Gagal. Periksa koneksi internet.", true);
      btn.disabled = false;
      btn.innerText = 'KIRIM LAPORAN ✔';
    }
  } catch (error) {
    showToast("Terjadi anomali server.", true);
    btn.disabled = false;
    btn.innerText = 'KIRIM LAPORAN ✔';
  }
});