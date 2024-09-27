import { AfterViewInit, Component, OnDestroy, OnInit,Input } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { NgxSpinnerService } from 'ngx-spinner';
import { Customer } from 'src/app/@shared/constant/customer';
import { ConfirmationModalComponent } from 'src/app/@shared/modals/confirmation-modal/confirmation-modal.component';
import { AppointmentsService } from 'src/app/@shared/services/appointment.service';
import { BreakpointService } from 'src/app/@shared/services/breakpoint.service';
import { CommunityService } from 'src/app/@shared/services/community.service';
import { CustomerService } from 'src/app/@shared/services/customer.service';
import { PostService } from 'src/app/@shared/services/post.service';
import { SeoService } from 'src/app/@shared/services/seo.service';
import { SharedService } from 'src/app/@shared/services/shared.service';
import { ToastService } from 'src/app/@shared/services/toast.service';
import { TokenStorageService } from 'src/app/@shared/services/token-storage.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-view-profile',
  templateUrl: './view-profile.component.html',
  styleUrls: ['./view-profile.component.scss'],
})
export class ViewProfileComponent implements OnInit, AfterViewInit, OnDestroy {
  customer: any = {};// customer: Customer = new Customer();
  customerPostList: any = [];
  userId: number;
  profilePic: any = {};
  coverPic: any = {};
  profileId: number;
  routeProfileId: number;
  activeTab = 1;
  communityList = [];
  communityId = '';
  isExpand = false;
  pdfList: any = [];
  appointmentList = [];

  constructor(
    private modalService: NgbActiveModal,
    private modal: NgbModal,
    private router: Router,
    private customerService: CustomerService,
    private spinner: NgxSpinnerService,
    private tokenStorage: TokenStorageService,
    public sharedService: SharedService,
    private communityService: CommunityService,
    public breakpointService: BreakpointService,
    private postService: PostService,
    private seoService: SeoService,
    private appointmentService: AppointmentsService,
    private toastService: ToastService
  ) {
    this.router.events.subscribe((event: any) => {
      const id = event?.routerEvent?.url.split('/')[3];
      this.profileId = id;
      this.routeProfileId = id;
      if (id) {
        this.getProfile(id);
      }
      this.profileId = +localStorage.getItem('profileId');
    });
  }
  ngOnInit(): void {
    if (!this.tokenStorage.getToken()) {
      this.router.navigate([`/login`]);
    }
    this.modalService.close();
  }

  ngAfterViewInit(): void {}

  getProfile(id): void {
    this.spinner.show();
    this.customerService.getProfile(id).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        if (res.data) {  
          this.customer = res.data[0];
          this.userId = res.data[0]?.UserID;
          const data = {
            title: this.customer?.Username,
            url: `${environment.webUrl}settings/view-profile/${this.customer?.Id}`,
            description: '',
            image: this.customer?.ProfilePicName,
          };
          this.seoService.updateSeoMetaData(data);
        }
      },
      error: (error) => {
        this.spinner.hide();
        console.log(error);
      },
    });
  }

  getCommunities(): void {
    this.spinner.show();
    this.communityList = [];
    this.communityService
      .getCommunityByUserId(this.profileId, 'community')
      .subscribe({
        next: (res: any) => {
          this.spinner.hide();
          if (res.data) {
            // this.communityList = res.data;
            res.data.forEach((element) => {
              if (element.Id && element.isApprove === 'Y') {
                this.communityList.push(element);
              }
            });
          }
        },
        error: (error) => {
          this.spinner.hide();
          console.log(error);
        },
      });
  }

  goToCommunityDetails(community: any): void {
    this.router.navigate([`health-practitioner/details/${community?.slug}`]);
  }

  openDropDown(id) {
    this.communityId = id;
    if (this.communityId) {
      this.isExpand = true;
    } else {
      this.isExpand = false;
    }
  }
  openEditProfile(): void {
    this.router.navigate([`settings/edit-profile/${this.profileId}`]);
    
    
  }

  ngOnDestroy(): void {
    this.communityList = [];
  }

  getPdfs(): void {
    this.postService.getPdfsFile(this.customer.profileId).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        if (res) {
          res.map((e: any) => {
            e.pdfName = e.pdfUrl.split('/')[3].replaceAll('%', ' ');
          });
          this.pdfList = res;
        }
      },
      error: (error) => {
        this.spinner.hide();
        console.log(error);
      },
    });
  }

  viewUserPost(id) {
    // this.router.navigate([`post/${id}`]);
    window.open(`post/${id}`, '_blank');
  }

  downloadPdf(pdf): void {
    const pdfLink = document.createElement('a');
    pdfLink.href = pdf;
    // window.open(pdf);
    // pdfLink.download = "TestFile.pdf";
    pdfLink.click();
  }

  getUserAppoinments(id): void {
    this.appointmentService.AppointmentViewProfile(id).subscribe({
      next: (res) => {
        this.appointmentList = res.data;
      },
      error: (err) => {},
    });
  }

  getStatus(appointment: any): string {
    const currentDate = new Date();
    const appointmentDate = new Date(appointment.appointmentDateTime);
    if (currentDate > appointmentDate) {
      return 'Expired';
    } else {
      return appointment.isCancelled === 'N' ? 'Scheduled' : 'Cancelled';
    }
  }

  appointmentCancelation(obj) {
    const modalRef = this.modal.open(ConfirmationModalComponent, {
      centered: true,
    });
    modalRef.componentInstance.title = `Cancel appointment`;
    modalRef.componentInstance.confirmButtonLabel = 'Ok';
    modalRef.componentInstance.cancelButtonLabel = 'Cancel';
    modalRef.componentInstance.message = `Are you sure want to cancel this appointment?`;
    modalRef.result.then((res) => {
      if (res === 'success') {
        const data = {
          appointmentId: obj.id,
          practitionerProfileId: obj.practitionerProfileId,
          profileId: obj.profileId,
          practitionerName: obj.practitionerName,
        };
        this.getCancelAppoinments(data);
      }
    });
  }

  getCancelAppoinments(obj): void {
    this.appointmentService.changeAppointmentStatus(obj).subscribe({
      next: (res) => {
        // this.appointmentList = res.data;
        this.toastService.success(res.message);
        this.getUserAppoinments(this.profileId);
      },
      error: (err) => {},
    });
  }

  displayLocalTime(utcDateTime: string): string {
    const localTime = moment.utc(utcDateTime).local();
    return localTime.format('h:mm A');
  }

  deletePost(postId): void {
    const modalRef = this.modal.open(ConfirmationModalComponent, {
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.title = 'Delete post';
    modalRef.componentInstance.confirmButtonLabel = 'Delete';
    modalRef.componentInstance.cancelButtonLabel = 'Cancel';
    modalRef.componentInstance.message =
      'Are you sure want to delete this post?';
    modalRef.result.then((res) => {
      if (res === 'success') {
        this.postService.deletePost(postId).subscribe({
          next: (res: any) => {
            if (res) {
              this.toastService.success('Post deleted successfully');
              this.getPdfs();
            }
          },
          error: (error) => {
            console.log('error : ', error);
          },
        });
      }
    });
  }
}
