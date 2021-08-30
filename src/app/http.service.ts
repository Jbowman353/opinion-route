import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

const httpHeaders = {
  clientId: 'd4aa6891-1b2c-470d-1fa6-08d824b9eaef',
  clientSecret: '660ffdf5-28e9-4f5b-a8b5-3321b015f11a'
}

/**
 * Not all-inclusive, but this represents the data returned from the API required for front end operations
 */
export interface ApiOutput {
  delivery_point_barcode: string;
  delivery_line_1: string;
  components: {
    zipcode: string
  },
  metadata: {
    latitude: number;
    longitude: number;
    utc_offset: number;
    dst: boolean
  }
}

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(private http: HttpClient) { }

  /**
   * Sends a request to the API to get more details about a location
   * @param street the street address as a string
   * @param city the city as a string
   * @param state the state abbreviation as a string
   * @returns Observable<ApiOutput[]>
   */
  getAddressInformation(street: string, city: string, state: string): Observable<ApiOutput[]> {
    const params: HttpParams = new HttpParams().set('street', street).set('city', city).set('state', state);
    return this.http.get<ApiOutput[]>(
      'https://validid-dev.navigatorsurveys.com/api/test/address',
      {headers: httpHeaders, params}
    )
  }
}
