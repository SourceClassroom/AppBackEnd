import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/apiResponse.js';

const API_KEY = process.env.ZOOM_API_KEY;
const API_SECRET = process.env.ZOOM_API_SECRET;

function generateZoomJWT() {
  const payload = { iss: API_KEY, exp: Math.floor(Date.now() / 1000) + 60 };
  return jwt.sign(payload, API_SECRET);
}

async function createMeeting(userId, meetingData) {
  const token = generateZoomJWT();
  try {
    const response = await fetch(`https://api.zoom.us/v2/users/${userId}/meetings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(meetingData)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw errorResponse('Error creating Zoom meeting', response.status, errorData);
    }
    return await response.json();
  } catch (error) {
    throw errorResponse('Error creating Zoom meeting', error.status || 500, error);
  }
}

export { generateZoomJWT, createMeeting };

