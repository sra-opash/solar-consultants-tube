import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { debounceTime, fromEvent } from 'rxjs';
import { Customer } from 'src/app/@shared/constant/customer';
import { CustomerService } from 'src/app/@shared/services/customer.service';
import { SeoService } from 'src/app/@shared/services/seo.service';
import { ToastService } from 'src/app/@shared/services/toast.service';
import { UploadFilesService } from 'src/app/@shared/services/upload-files.service';
import { environment } from 'src/environments/environment';

declare var turnstile: any;
@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
})
export class SignUpComponent implements OnInit, AfterViewInit {
  customer = new Customer();
  useDetails: any = {};
  isragister = false;
  registrationMessage = '';
  confirm_password = '';
  msg = '';
  userId = '';
  submitted = false;
  allCountryData: any;
  type = 'danger';
  defaultCountry = 'US';
  allStateData: any;
  profilePic = '';
  profileImg: any = {
    file: null,
    url: '',
  };
  passwordHidden: boolean = true;
  confirmPasswordHidden: boolean = true;

  @ViewChild('zipCode') zipCode: ElementRef;

  registerForm = new FormGroup({
    FirstName: new FormControl(''),
    LastName: new FormControl(''),
    Username: new FormControl('', [Validators.required]),
    Email: new FormControl('', [Validators.required]),
    Password: new FormControl('', [Validators.required]),
    confirm_password: new FormControl('', [Validators.required]),
    MobileNo: new FormControl(''),
    Country: new FormControl('US', [Validators.required]),
    Zip: new FormControl('', Validators.required),
    State: new FormControl('', Validators.required),
    City: new FormControl(''),
    County: new FormControl(''),
    TermAndPolicy: new FormControl(false, Validators.required),
  });
  theme = '';
  captchaToken = '';
  @ViewChild('captcha', { static: false }) captchaElement: ElementRef;

  constructor(
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    private customerService: CustomerService,
    private router: Router,
    private uploadService: UploadFilesService,
    private toastService: ToastService,
    private seoService: SeoService
  ) {
    const data = {
      title: 'Solar Consultants Registration',
      url: `${environment.webUrl}sign-up`,
      description: 'Registration page',
      image: `${environment.webUrl}assets/images/landingpage/solar-consultants-logo.png`,
    };
    // this.seoService.updateSeoMetaData(data);
    this.theme = localStorage.getItem('theme');
  }

  ngOnInit(): void {
    this.getAllCountries();
  }

  ngAfterViewInit(): void {
    // this.loadCloudFlareWidget();
    // fromEvent(this.zipCode.nativeElement, 'input')
    //   .pipe(debounceTime(1000))
    //   .subscribe((event) => {
    //     const val = event['target'].value;
    //     if (val.length > 3) {
    //       // this.onZipChange(val);
    //     }
    //   });
  }

  togglePasswordVisibility(passwordInput: HTMLInputElement) {
    passwordInput.type =
      passwordInput.type === 'password' ? 'text' : 'password';
    this.passwordHidden = !this.passwordHidden;
  }

  toggleConfirmPasswordVisibility(confirmpasswordInput: HTMLInputElement) {
    confirmpasswordInput.type =
      confirmpasswordInput.type === 'password' ? 'text' : 'password';
    this.confirmPasswordHidden = !this.confirmPasswordHidden;
  }
  selectFiles(event) {
    this.profileImg = event;
  }

  // loadCloudFlareWidget() {
  //   turnstile?.render(this.captchaElement.nativeElement, {
  //     sitekey: environment.siteKey,
  //     theme: this.theme === 'dark' ? 'light' : 'dark',
  //     callback: function (token) {
  //       localStorage.setItem('captcha-token', token);
  //       this.captchaToken = token;
  //       console.log(`Challenge Success ${token}`);
  //       if (!token) {
  //         this.msg = 'invalid captcha kindly try again!';
  //         this.type = 'danger';
  //       }
  //     },
  //   });
  // }

  upload(file: any = {}) {
    this.spinner.show();
    if (file) {
      this.uploadService.uploadFile(file).subscribe({
        next: (res: any) => {
          this.spinner.hide();
          if (res.body) {
            this.profilePic = res?.body?.url;
            this.creatProfile(this.registerForm.value);
          }
        },
        error: (err) => {
          this.spinner.hide();
          this.profileImg = {
            file: null,
            url: '',
          };
          return 'Could not upload the file:' + file.name;
        },
      });
    } else {
      this.spinner.hide();
      this.creatProfile(this.registerForm.value);
    }
  }

  save() {
    this.spinner.show();
    // const token = localStorage.getItem('captcha-token');
    // if (!token) {
    //   this.spinner.hide();
    //   this.msg = 'Invalid captcha kindly try again!';
    //   this.type = 'danger';
    //   this.scrollTop();
    //   return;
    // }
    this.customerService.createCustomer(this.registerForm.value).subscribe({
      next: (data: any) => {
        this.spinner.hide();
        if (!data.error) {
          this.submitted = true;
          window.sessionStorage.user_id = data.data;
          this.registrationMessage =
            'Your account has registered successfully. Kindly login with your email and password !!!';
          this.scrollTop();
          this.isragister = true;
          const id = data.data;
          if (id) {
            this.upload(this.profileImg?.file);
            localStorage.setItem('register', String(this.isragister));
            this.router.navigateByUrl('/login?isVerify=false');
          }
        }
      },
      error: (err) => {
        this.registrationMessage = err.error.message;
        this.type = 'danger';
        this.spinner.hide();
        this.scrollTop();
      },
    });
  }

  validatepassword(): boolean {
    const pattern = '[a-zA-Z0-9]{5,}';
    // const pattern =
    //   '(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[a-z])(?=.*[0-9].*[0-9]).{8}';

    if (!this.registerForm.get('Password').value.match(pattern)) {
      this.msg = 'Password must be a minimum of 5 characters';
      // this.msg =
      //   'Password must be a minimum of 8 characters and include one uppercase letter, one lowercase letter, and one special character';
      this.scrollTop();
      return false;
    }

    if (
      this.registerForm.get('Password').value !==
      this.registerForm.get('confirm_password').value
    ) {
      this.msg = 'Passwords do not match';
      this.scrollTop();
      return false;
    }

    return true;
  }

  onSubmit(): void {
    this.msg = '';
    // if (!this.profileImg?.file?.name) {
    //   this.msg = 'Please upload profile picture';
    //   this.scrollTop();
    //   // return false;
    // }
    // this.profileImg?.file?.name &&
    if (
      this.registerForm.valid &&
      this.registerForm.get('TermAndPolicy').value === true
    ) {
      if (!this.validatepassword()) {
        return;
      }
      this.save();
    } else {
      this.msg = 'Please enter mandatory fields(*) data.';
      this.scrollTop();
    }
  }

  changeCountry() {
    this.registerForm.get('Zip').setValue('');
    this.registerForm.get('State').setValue('');
    this.registerForm.get('City').setValue('');
    this.registerForm.get('County').setValue('');
  }

  getAllCountries() {
    this.spinner.show();

    this.customerService.getCountriesData().subscribe({
      next: (result) => {
        this.spinner.hide();
        this.allCountryData = result;
        this.registerForm.get('Zip').enable();
        this.getAllState(this.defaultCountry);
      },
      error: (error) => {
        this.spinner.hide();
        console.log(error);
      },
    });
  }

  onCountryChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.getAllState(target.value);
  }

  getAllState(selectCountry) {
    // this.spinner.show();
    this.customerService.getStateData(selectCountry).subscribe({
      next: (result) => {
        this.spinner.hide();
        this.allStateData = result;
      },
      error: (error) => {
        this.spinner.hide();
        console.log(error);
      },
    });
  }

  // onZipChange(event) {
  //   this.spinner.show();
  //   this.customerService
  //     .getZipData(event, this.registerForm.get('Country').value)
  //     .subscribe(
  //       (data) => {
  //         if (data[0]) {
  //           const zipData = data[0];
  //           this.registerForm.get('State').enable();
  //           this.registerForm.get('City').enable();
  //           this.registerForm.get('County').enable();
  //           this.registerForm.patchValue({
  //             State: zipData.state,
  //             City: zipData.city,
  //             County: zipData.places,
  //           });
  //         } else {
  //           this.registerForm.get('State').disable();
  //           this.registerForm.get('City').disable();
  //           this.registerForm.get('County').disable();
  //           this.toastService.danger(data?.message);
  //         }

  //         this.spinner.hide();
  //       },
  //       (err) => {
  //         this.spinner.hide();
  //         console.log(err);
  //       }
  //     );
  // }

  changetopassword(event) {
    event.target.setAttribute('type', 'password');
    this.msg = '';
  }

  creatProfile(data) {
    this.spinner.show();
    const profile = {
      Username: data?.Username,
      FirstName: data?.FirstName,
      LastName: data?.LastName,
      Address: data?.Address,
      Country: data?.Country,
      City: data?.City,
      State: data?.State,
      County: data?.County,
      Zip: data?.Zip,
      MobileNo: data?.MobileNo,
      UserID: window?.sessionStorage?.user_id,
      IsActive: 'N',
      ProfilePicName: this.profilePic || null,
    };
    console.log(profile);

    this.customerService.createProfile(profile).subscribe({
      next: (data: any) => {
        this.spinner.hide();

        if (data) {
          const profileId = data.data;
          localStorage.setItem('profileId', profileId);
        }
      },
      error: (err) => {
        this.spinner.hide();
      },
    });
  }

  clearProfileImg(event: any): void {
    event.stopPropagation();
    event.preventDefault();

    this.profileImg = {
      file: null,
      url: '',
    };
  }

  scrollTop(): void {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }
  onChangeTag(event) {
    this.registerForm
      .get('Username')
      .setValue(event.target.value.replaceAll(' ', ''));
  }

  convertToUppercase(event: any) {
    const inputElement = event.target as HTMLInputElement;
    let inputValue = inputElement.value;
    inputValue = inputValue.replace(/\s/g, '');
    inputElement.value = inputValue.toUpperCase();
  }
}
