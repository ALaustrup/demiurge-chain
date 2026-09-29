import axios from "axios";
import type { AuthResponse, User } from "@lib/types/index";

const authUrl = process.env.NEXT_PUBLIC_QOR_AUTH_URL || "http://localhost:3001";

class QORAuthClient {
  private url: string;

  constructor(url: string = authUrl) {
    this.url = url;
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${this.url}/api/auth/login`, {
      username,
      password,
    });
    return response.data;
  }

  async signup(username: string, email: string, password: string): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${this.url}/api/auth/signup`, {
      username,
      email,
      password,
    });
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(
      `${this.url}/api/auth/refresh`,
      { refreshToken }
    );
    return response.data;
  }

  async verifyToken(accessToken: string): Promise<User> {
    const response = await axios.get<{ user: User }>(
      `${this.url}/api/auth/verify`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data.user;
  }

  async logout(accessToken: string): Promise<void> {
    await axios.post(
      `${this.url}/api/auth/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  async enable2FA(accessToken: string): Promise<{ qrCode: string; secret: string }> {
    const response = await axios.post(
      `${this.url}/api/auth/2fa/enable`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  }

  async verify2FA(accessToken: string, code: string): Promise<void> {
    await axios.post(
      `${this.url}/api/auth/2fa/verify`,
      { code },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }
}

export const qorAuth = new QORAuthClient();
