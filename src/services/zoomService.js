const axios = require('axios');
const jwt = require('jsonwebtoken');

const API_KEY = process.env.ZOOM_API_KEY;
const API_SECRET = process.env.ZOOM_API_SECRET;

// Zoom API kimlik doğrulama hatası için özel hata sınıfı
class ZoomAuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ZoomAuthenticationError';
  }
}
class ZoomAPIError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'ZoomAPIError';
    this.statusCode = statusCode;
  }
}

// API kimlik bilgilerini doğrulama
function validateCredentials() {
  if (!API_KEY || !API_SECRET) {
    throw new ZoomAuthenticationError('Zoom API kimlik bilgileri eksik');
  }
}

// JWT oluşturma
function generateZoomJWT() {
  validateCredentials();
  
  const payload = {
    iss: API_KEY,
    exp: Math.floor(Date.now() / 1000) + 60 // Token 60 saniye sonrası Timeouta düşecek
  };
  return jwt.sign(payload, API_SECRET);
}

// Zoom toplantısı oluştur
async function createMeeting(userId, meetingData, maxRetries = 2) {
  validateCredentials();
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const token = generateZoomJWT();
    
    try {
      const response = await axios.post(
        `https://api.zoom.us/v2/users/${userId}/meetings`,
        meetingData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      // Hata senaryolarını işle
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 401) {
          throw new ZoomAuthenticationError('Geçersiz Zoom API kimlik bilgileri');
        }
        
        throw new ZoomAPIError(`Zoom API Hatası: ${data.message || 'Bilinmeyen hata'}`, status);
      } else if (error.request) {
        console.warn(`Zoom API isteği başarısız oldu (Deneme ${attempt}):`, error.message);
        
        // Eğer Timeouta düşer ise, yeniden deneme için ;
        if (attempt === maxRetries) {
          throw new Error('Zoom API isteği birden fazla denemeden sonra başarısız oldu');
        }
      } else {
        // Dahada olmuyosa koy göte
        throw error;
      }
    }
  }
}

module.exports = {
  generateZoomJWT,
  createMeeting,
  ZoomAuthenticationError,
  ZoomAPIError
};
