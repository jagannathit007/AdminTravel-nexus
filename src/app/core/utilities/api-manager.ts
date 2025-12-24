import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ResponseModel } from './response-model';
import { AppStorage } from './app-storage';
import { common } from '../constants/common';

// Define an interface for the request configuration
interface RequestConfig {
  url: string;
  method: string;
  isFormData?: boolean; // Add optional isFormData property
}

@Injectable({
  providedIn: 'root',
})
export class ApiManager {
  constructor(private http: HttpClient, private appStorage: AppStorage) {}

  private setHeaders = (headersInArray: any[]) => {
    let headers: any = {};
    headersInArray.forEach((element) => {
      Object.keys(element).forEach((key) => {
        headers[key] = element[key];
      });
    });
    return { headers: new HttpHeaders(headers) };
  };

  request = async (
    config: RequestConfig, // Use the interface here
    data: any,
    headers: any[]
  ) => {
    try {
      switch (config.method) {
        case 'GET':
          return await firstValueFrom(
            this.http.get<ResponseModel>(config.url, this.setHeaders(headers))
          );
        case 'POST':
          // Handle FormData - don't set Content-Type header, let browser set it with boundary
          if (config.isFormData && data instanceof FormData) {
            const formDataHeaders = headers.filter((h: any) => !h['Content-Type']);
            return await firstValueFrom(
              this.http.post<ResponseModel>(
                config.url,
                data,
                this.setHeaders(formDataHeaders)
              )
            );
          }
          return await firstValueFrom(
            this.http.post<ResponseModel>(
              config.url,
              data, 
              this.setHeaders(headers)
            )
          );
        case 'PUT':
          return await firstValueFrom(
            this.http.put<ResponseModel>(
              config.url,
              data,
              this.setHeaders(headers)
            )
          );
        case 'DELETE':
          return await firstValueFrom(
            this.http.delete<ResponseModel>(
              config.url,
              this.setHeaders(headers)
            )
          );
        default: {
          let response: ResponseModel = {
            data: 0,
            message: 'Unknown request type!',
            status: 0,
          };
          return response;
        }
      }
    } catch (error: any) {
      if (error.status != null) {
        console.log(error.status);
        if (String(error.status) === '401') {
          this.appStorage.clearAll();
          window.location.href = '/';
        }
      }
      throw error;
    }
  };
}