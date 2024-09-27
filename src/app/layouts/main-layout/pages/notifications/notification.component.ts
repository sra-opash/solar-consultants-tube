import { Component } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';
import { ToastService } from 'src/app/@shared/services/toast.service';
import { CustomerService } from 'src/app/@shared/services/customer.service';
import { SeoService } from 'src/app/@shared/services/seo.service';
import { SocketService } from 'src/app/@shared/services/socket.service';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
})
export class NotificationsComponent {
  notificationList: any[] = [];
  activePage = 1;
  hasMoreData = false;

  constructor(
    private customerService: CustomerService,
    private spinner: NgxSpinnerService,
    private router: Router,
    private toastService: ToastService,
    private seoService: SeoService,
    private socketService: SocketService
  ) { 
    const data = {
      title: 'Solar Consultants Notification',
      url: `${window.location.href}`,
      description: '',
    };
    this.seoService.updateSeoMetaData(data);
    const profileId = +localStorage.getItem('profileId');
    this.socketService.readNotification({ profileId }, (data) => {}); 
  }

  ngOnInit(): void {
    this.getNotificationList();
  }

  getNotificationList() {
    this.spinner.show();
    const id = localStorage.getItem('profileId');
    const data = {
      page: this.activePage,
      size: 30,
    };
    this.customerService.getNotificationList(Number(id), data).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        if (this.activePage < res.pagination.totalPages) {
          this.hasMoreData = true;
        }
        this.notificationList = [...this.notificationList, ...res?.data];
      },
      error: (error) => {
        this.spinner.hide();
        console.log(error);
      },
    });
  }

  viewUserPost(id) {
    this.router.navigate([`post/${id}`]);
  }

  removeNotification(id: number): void {
    this.customerService.deleteNotification(id).subscribe({
      next: (res: any) => {
        this.toastService.success(
          res.message || 'Notification delete successfully'
        );
        this.notificationList = [];
        this.getNotificationList();
      },
    });
  }

  readUnreadNotification(notification, isRead): void {
    this.customerService.readUnreadNotification(notification.id, isRead).subscribe({
      next: (res) => {
        this.toastService.success(res.message); 
        notification.isRead = isRead;
      },    
    });
  }
  loadMoreNotification(): void {
    this.activePage = this.activePage + 1;
    this.getNotificationList();
  }
}
