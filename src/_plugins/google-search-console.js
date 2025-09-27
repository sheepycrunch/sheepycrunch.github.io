const { google } = require('googleapis');

class GoogleSearchConsoleStats {
  constructor() {
    this.auth = null;
    this.searchconsole = null;
  }

  // Google API 인증 설정
  async authenticate() {
    if (this.auth) return this.auth;

    try {
      // 서비스 계정 키 파일 경로 (환경변수에서 가져오기)
      const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
      if (!keyFile) {
        console.warn('GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set.');
        return null;
      }

      this.auth = new google.auth.GoogleAuth({
        keyFile: keyFile,
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
      });

      this.searchconsole = google.searchconsole({ version: 'v1', auth: this.auth });
      return this.auth;
    } catch (error) {
      console.error('Google Search Console authentication failed:', error);
      return null;
    }
  }

  // 특정 사이트의 검색 분석 데이터 가져오기
  async getSearchAnalytics(siteUrl, startDate, endDate) {
    try {
      await this.authenticate();
      if (!this.searchconsole) return null;

      const response = await this.searchconsole.searchanalytics.query({
        siteUrl: siteUrl,
        requestBody: {
          startDate: startDate,
          endDate: endDate,
          dimensions: ['date'],
          rowLimit: 1000
        }
      });

      return response.data.rows || [];
    } catch (error) {
      console.error(`Failed to fetch search analytics data (${siteUrl}):`, error);
      return [];
    }
  }

  // 여러 사이트의 통계를 합치기
  async getCombinedStats(siteUrls, startDate, endDate) {
    const allStats = [];
    
    for (const siteUrl of siteUrls) {
      const stats = await this.getSearchAnalytics(siteUrl, startDate, endDate);
      allStats.push(...stats);
    }

    // 날짜별로 그룹화하고 합계 계산
    const combinedStats = {};
    
    allStats.forEach(stat => {
      const date = stat.keys[0];
      if (!combinedStats[date]) {
        combinedStats[date] = {
          date: date,
          clicks: 0,
          impressions: 0,
          ctr: 0,
          position: 0
        };
      }
      
      combinedStats[date].clicks += parseInt(stat.clicks) || 0;
      combinedStats[date].impressions += parseInt(stat.impressions) || 0;
    });

    // CTR과 평균 위치 계산
    Object.values(combinedStats).forEach(stat => {
      stat.ctr = stat.impressions > 0 ? (stat.clicks / stat.impressions * 100).toFixed(2) : 0;
    });

    return Object.values(combinedStats).sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  // 최근 30일 통계 요약
  async getRecentStats(siteUrls) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const stats = await this.getCombinedStats(siteUrls, startDateStr, endDateStr);
    
    // 총합 계산
    const totals = stats.reduce((acc, stat) => {
      acc.totalClicks += stat.clicks;
      acc.totalImpressions += stat.impressions;
      return acc;
    }, { totalClicks: 0, totalImpressions: 0 });

    totals.averageCtr = totals.totalImpressions > 0 
      ? (totals.totalClicks / totals.totalImpressions * 100).toFixed(2)
      : 0;

    return {
      daily: stats,
      totals: totals
    };
  }
}

module.exports = GoogleSearchConsoleStats;
