import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Custom
import { ApiOutput, HttpService } from './http.service';
import { STATES } from './stateOptions';

/**
 * Interface representing the results to be displayed, converted from the API results
 */
interface Result {
  zip: number;
  localTime: string;
  deliveryLineOneRev: string;
  timeElapsedMs: number;
  latLon: string;
  barcode: string;
  barcodeCalculation?: number;
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'opinion-route'; 
  showFormError = false; // Whether or not to show the form error message
  showResults = false; // Whether or not results are available for display
  results: Result[] = []; // Results to be displayed

  stateOptions = STATES;

  // Form Controls
  addressControl = new FormControl('', Validators.required);
  cityControl = new FormControl('', Validators.required);
  stateControl = new FormControl('', Validators.required);

  // The form itself
  form = new FormGroup({
    street: this.addressControl,
    city: this.cityControl,
    state: this.stateControl
  });

  constructor(private http: HttpService) { }

  /**
   * The submission callback for the form, which sends an API request
   */
  onSubmit() {
    const startTime = new Date();
    this.showFormError = false;
    this.showResults = false;
    this.http.getAddressInformation(this.addressControl.value, this.cityControl.value, this.stateControl.value)
      .pipe(
        catchError(this.handleFormError.bind(this))
      ).subscribe((res: ApiOutput[]) => {
        const endTime = new Date();
        // Convert the raw API results to the required values for display
        this.results = res.map((rawOutput: ApiOutput) => {
          return {
            zip: Number(rawOutput.components.zipcode),
            timeElapsedMs: (endTime.getTime() - startTime.getTime()),
            latLon: `(${rawOutput.metadata.latitude.toFixed(2)}, ${rawOutput.metadata.longitude.toFixed(2)})`,
            barcodeCalculation: this.findLowestDivisible(Number(rawOutput.delivery_point_barcode)),
            barcode: rawOutput.delivery_point_barcode,
            deliveryLineOneRev: rawOutput.delivery_line_1.toUpperCase().split(' ').reverse().join(' '),
            localTime: this.getLocalTime(rawOutput.metadata.utc_offset, rawOutput.metadata.dst)
          }
        });
        this.showResults = true;
      });
  }

  /////////////////////////
  // Some helper functions
  /////////////////////////

  private handleFormError(err: HttpErrorResponse) {
    this.showFormError = true;
    return throwError('Unable to submit form');
  }

  private getLocalTime(utcOffset: number, dst: boolean): string {
    const currentDate = new Date();
    let localHour = currentDate.getUTCHours() + utcOffset + (dst ? 1 : 0);

    if (localHour === 0 || localHour === 24) { // Midnight, 12:XX AM
      return `12:${currentDate.getUTCMinutes().toPrecision(2)} AM`;
    } else if (localHour === 12) { // Noon, 12:XX PM
      return `12:${currentDate.getUTCMinutes().toPrecision(2)} PM`;
    } else if (localHour > 12) { // Sometime in the afternoon
      return `${localHour - 12}:${currentDate.getUTCMinutes().toPrecision(2)} PM`;
    } else if (localHour < 0) { // Sometime at night, one day behind UTC
      return `${12 + localHour}:${currentDate.getUTCMinutes().toPrecision(2)} PM`;
    } else { // Sometime in the morning
      return `${localHour}:${currentDate.getUTCMinutes().toPrecision(2)} AM`;
    }

  }

  private findLowestDivisible(num: number): number | undefined {
    // only check primes to avoid some redundancy
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 25, 29, 31, 35, 37, 41, 43, 47, 49];
    let lowest: number = 0;
    for (const prime of primes) {
      if (num % prime === 0) {
        lowest = prime;
        break;
      }
    }
    return lowest || undefined;
  }
}
