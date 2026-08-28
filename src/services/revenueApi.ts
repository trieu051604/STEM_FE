import apiClient from './api';

export interface RevenueSummary {
  totalRevenue: number;
  totalTokensSold: number;
  totalPayments: number;
  averagePayment: number;
}

export interface RevenueByMonth {
  month: string;
  revenue: number;
  payments: number;
}

export interface RevenueByPackage {
  package: string;
  revenue: number;
  count: number;
}

export interface TopSchool {
  schoolId: number;
  schoolName: string;
  revenue: number;
  payments: number;
}

export interface RecentPayment {
  id: number;
  schoolName: string;
  packageName: string;
  amount: number;
  tokens: number;
  date: string;
}

export interface RevenueStatsResponse {
  success: boolean;
  data: {
    summary: RevenueSummary;
    revenueByMonth: RevenueByMonth[];
    revenueByPackage: RevenueByPackage[];
    topSchools: TopSchool[];
    recentPayments: RecentPayment[];
  };
}

export const revenueApi = {
  getStats: async (): Promise<RevenueStatsResponse> => {
    const response = await apiClient.get('/payments/admin/revenue');
    return response.data;
  },
};
