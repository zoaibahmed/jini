import { Controller, Get, Post, Put, Patch, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class MockController {

  // 3. Appointment Module (Removed - now handled by AppointmentController)

  // 4. Educational Resources Module
  @Get('resources')
  async getResources(@Query('all') all?: string) {
    return [
      {
        id: 'art-1',
        title: 'TLC License Renewal Checklist',
        body: '1. Complete Drug Testing\n2. 24-Hour TLC Course\n3. Take Defensive Driving course',
        category: 'TLC',
        createdAt: '2026-05-01T00:00:00.000Z',
      },
      {
        id: 'art-2',
        title: 'Understanding DMV Points',
        body: 'DMV point accumulation rules and suspension triggers...',
        category: 'DMV',
        createdAt: '2026-05-02T00:00:00.000Z',
      },
    ];
  }

  // 5. Driver Profile Module (Removed - now handled by DriverController)

  // 6. Admin Panel Module
  @Get('admin/dashboard')
  async getAdminDashboard() {
    return {
      totalDrivers: 150,
      activeSubscriptions: 120,
      monthlyRevenue: 15900,
    };
  }

  @Get('admin/users')
  async getAdminUsers() {
    return [
      { id: 'user-1', name: 'John Doe', email: 'john@example.com', role: 'DRIVER' },
      { id: 'user-2', name: 'Agent Smith', email: 'smith@example.com', role: 'SUPPORT' },
    ];
  }

  @Get('admin/announcements')
  async getAdminAnnouncements() {
    return [];
  }

  @Get('admin/logs')
  async getAdminLogs() {
    return [];
  }

  @Get('admin/plans')
  async getAdminPlans() {
    return [
      { id: 'bronze', name: 'Bronze Plan', price: 49 },
      { id: 'silver', name: 'Silver Plan', price: 99 },
      { id: 'gold', name: 'Gold Plan', price: 199 },
    ];
  }

  @Get('admin/coupons')
  async getAdminCoupons() {
    return [];
  }

  @Get('admin/payments')
  async getAdminPayments() {
    return [];
  }


  // 8. Support Module (Removed - now handled by SupportController)

  // 9. WhatsApp Module (Removed - now handled by WhatsappController)

  // 10. Voice Module
  @Get('voice/calls')
  async getVoiceCalls() {
    return [];
  }

  @Get('voice/analytics')
  async getVoiceAnalytics() {
    return {
      totalCalls: 25,
      completedCalls: 20,
      avgCallDuration: '2m 15s',
    };
  }
}


