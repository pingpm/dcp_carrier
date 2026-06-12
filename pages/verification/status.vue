<template>
  <view class="page status-page">
    <!-- Status Header Banner -->
    <view
      class="status-banner-card"
      :class="status.reviewStatus ? status.reviewStatus.toLowerCase() : 'unverified'"
    >
      <view class="status-icon-wrap">
        <image v-if="statusIcon" :src="statusIcon" mode="aspectFit" class="status-icon-image" />
        <image v-else class="status-icon-image" src="/static/icons/user.svg" mode="aspectFit" />
      </view>
      <view class="status-banner-meta">
        <view class="status-title-text">{{
          reviewStatusText[status.reviewStatus] || '未认证'
        }}</view>
        <view class="status-subtitle-text">
          <text v-if="status.reviewStatus === 'APPROVED'"
            >恭喜！您的资质已通过审核，可正常对外展示并承接订单。</text
          >
          <text v-else-if="status.reviewStatus === 'PENDING'"
            >资质正在审核中，审核期间原有生效资质（若有）仍有效。</text
          >
          <text v-else-if="status.reviewStatus === 'REJECTED'"
            >您的申请未能通过审核，请查看原因并重新提交资料。</text
          >
          <text v-else>您尚未提交认证，审核通过前将无法正常承接订单。</text>
        </view>
        <view v-if="showRejectReason" class="inline-reject-reason">
          <text class="inline-reject-label">驳回原因</text>
          <text class="inline-reject-text">{{ rejectReasonText }}</text>
        </view>
      </view>
    </view>

    <view v-if="hasVerificationVersion" class="section info-card">
      <view class="section-title">承运商资质档案</view>

      <view class="info-list">
        <view class="info-row-item">
          <text class="row-label">企业名称</text>
          <text class="row-value">{{ safeText(verification.companyName) }}</text>
        </view>
        <view class="info-row-item">
          <text class="row-label">统一社会信用代码</text>
          <text class="row-value">{{ safeText(verification.creditCode) }}</text>
        </view>
        <view class="info-row-item">
          <text class="row-label">法人名称</text>
          <text class="row-value">{{ safeText(verification.legalRepresentativeName) }}</text>
        </view>
        <view class="info-row-item">
          <text class="row-label">公司类型</text>
          <text class="row-value">
            {{
              formatCompanyType(verification.companyType, verification.serviceCapabilities) ||
              '未填写'
            }}
          </text>
        </view>
        <view class="info-row-item">
          <text class="row-label">可提供服务</text>
          <text class="row-value">{{
            serviceCapabilitiesText(verification.serviceCapabilities)
          }}</text>
        </view>
        <view class="info-row-item">
          <text class="row-label">认证方式</text>
          <text class="row-value">{{
            verificationMethodText(verification.verificationMethod)
          }}</text>
        </view>
        <view v-if="status.submittedAt || verification.submittedAt" class="info-row-item">
          <text class="row-label">提交时间</text>
          <text class="row-value">{{
            dateText(status.submittedAt || verification.submittedAt)
          }}</text>
        </view>
        <view v-if="status.reviewedAt || verification.reviewedAt" class="info-row-item">
          <text class="row-label">审核时间</text>
          <text class="row-value">{{
            dateText(status.reviewedAt || verification.reviewedAt)
          }}</text>
        </view>
      </view>

      <view v-if="businessLicenseFiles.length" class="file-group">
        <view class="file-group-title">营业执照照片</view>
        <view class="file-grid">
          <view
            v-for="file in businessLicenseFiles"
            :key="file.fileId"
            class="file-thumb"
            @click="previewFiles(businessLicenseFiles, file.fileUrl)"
          >
            <image :src="file.fileUrl" mode="aspectFill" class="file-image" />
          </view>
        </view>
      </view>
    </view>

    <view v-if="hasVerificationVersion" class="section info-card">
      <view class="section-title">经营地址</view>
      <view class="info-list">
        <view class="info-row-item">
          <text class="row-label">所在省市</text>
          <text class="row-value">{{ regionText }}</text>
        </view>
        <view class="info-row-item column-row">
          <text class="row-label">详细地址</text>
          <text class="row-value multiline-value">{{ addressText }}</text>
        </view>
        <view class="info-row-item" v-if="coordinateText !== '-'">
          <text class="row-label">经纬度</text>
          <text class="row-value">{{ coordinateText }}</text>
        </view>
      </view>
    </view>

    <view v-if="hasVerificationVersion" class="section info-card">
      <view class="section-title">身份认证信息</view>
      <view class="info-list">
        <template v-if="verification.verificationMethod === 'AUTHORIZED_AGENT'">
          <view class="info-row-item">
            <text class="row-label">经办人姓名</text>
            <text class="row-value">{{ safeText(verification.agentName) }}</text>
          </view>
          <view class="info-row-item">
            <text class="row-label">经办人身份证号</text>
            <text class="row-value">{{ safeText(verification.agentIdNumber) }}</text>
          </view>
        </template>
        <template v-else>
          <view class="info-row-item">
            <text class="row-label">法人姓名</text>
            <text class="row-value">{{ safeText(verification.legalRepresentativeName) }}</text>
          </view>
          <view class="info-row-item">
            <text class="row-label">法人身份证号</text>
            <text class="row-value">{{ safeText(verification.legalIdNumber) }}</text>
          </view>
        </template>
      </view>

      <view v-if="identityFiles.length" class="file-group">
        <view class="file-group-title">身份证件照片</view>
        <view class="file-grid">
          <view
            v-for="file in identityFiles"
            :key="file.fileId"
            class="file-item"
            @click="previewFiles(identityFiles, file.fileUrl)"
          >
            <image :src="file.fileUrl" mode="aspectFill" class="file-image" />
            <text class="file-label">{{ fileUsageText(file.usageScene) }}</text>
          </view>
        </view>
      </view>

      <view v-if="authorizationLetterFiles.length" class="file-group">
        <view class="file-group-title">授权委托书</view>
        <view class="file-grid">
          <view
            v-for="file in authorizationLetterFiles"
            :key="file.fileId"
            class="file-item"
            @click="previewFiles(authorizationLetterFiles, file.fileUrl)"
          >
            <image :src="file.fileUrl" mode="aspectFill" class="file-image" />
            <text class="file-label">{{ fileUsageText(file.usageScene) }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="showLargeTruckSection" class="section info-card">
      <view class="section-title">道路运输许可信息</view>
      <view class="info-list">
        <view class="info-row-item">
          <text class="row-label">业户名称</text>
          <text class="row-value">{{ safeText(largeTruckLicense.licenseHolderName) }}</text>
        </view>
        <view class="info-row-item">
          <text class="row-label">许可证字号</text>
          <text class="row-value">{{ safeText(largeTruckLicense.licenseNumber) }}</text>
        </view>
        <view class="info-row-item">
          <text class="row-label">有效期</text>
          <text class="row-value">{{ licenseDateRangeText }}</text>
        </view>
      </view>

      <view v-if="roadLicenseFiles.length" class="file-group">
        <view class="file-group-title">道路运输许可证照片</view>
        <view class="file-grid">
          <view
            v-for="file in roadLicenseFiles"
            :key="file.fileId"
            class="file-thumb"
            @click="previewFiles(roadLicenseFiles, file.fileUrl)"
          >
            <image :src="file.fileUrl" mode="aspectFill" class="file-image" />
          </view>
        </view>
      </view>

      <view v-if="operationSiteFiles.length" class="file-group">
        <view class="file-group-title">办公/场地经营照片</view>
        <view class="file-grid">
          <view
            v-for="file in operationSiteFiles"
            :key="file.fileId"
            class="file-thumb"
            @click="previewFiles(operationSiteFiles, file.fileUrl)"
          >
            <image :src="file.fileUrl" mode="aspectFill" class="file-image" />
          </view>
        </view>
      </view>
    </view>

    <view v-if="!hasVerificationVersion" class="section info-card">
      <view class="section-title">承运商资质档案</view>
      <view class="info-list">
        <view class="info-row-item">
          <text class="row-label">企业名称</text>
          <text class="row-value">{{ status.companyName || '未填写' }}</text>
        </view>
        <view class="info-row-item">
          <text class="row-label">公司类型</text>
          <text class="row-value">
            {{ formatCompanyType(status.companyType, status.serviceCapabilities) || '未填写' }}
          </text>
        </view>
        <view v-if="status.submittedAt" class="info-row-item">
          <text class="row-label">提交时间</text>
          <text class="row-value">{{ dateText(status.submittedAt) }}</text>
        </view>
        <view v-if="status.reviewedAt" class="info-row-item">
          <text class="row-label">审核时间</text>
          <text class="row-value">{{ dateText(status.reviewedAt) }}</text>
        </view>
      </view>
    </view>

    <!-- Guide Panel -->
    <view class="section guide-card">
      <view class="section-title">承运商入驻说明</view>
      <view class="guide-steps">
        <view class="guide-step">
          <text class="step-num">01</text>
          <view class="step-meta">
            <text class="step-title">资质审核与接单</text>
            <text class="step-desc"
              >未认证通过前可以维护线路，但线路不会对外公开展示，且无法承接新订单。</text
            >
          </view>
        </view>
        <view class="guide-step">
          <text class="step-num">02</text>
          <view class="step-meta">
            <text class="step-title">修改公司类型提示</text>
            <text class="step-desc"
              >若重新提交认证时从轿运公司改为道路救援公司，大板线路将在审核通过后自动关闭。</text
            >
          </view>
        </view>
      </view>
    </view>

    <!-- Fixed Action Footer -->
    <view class="fixed-footer button-row">
      <button class="plain-btn flex-1 animate-btn" @click="goHome">返回工作台</button>
      <button
        v-if="status.reviewStatus !== 'PENDING'"
        class="primary-btn flex-1 animate-btn"
        @click="goForm"
      >
        {{
          status.reviewStatus === 'REJECTED' || status.reviewStatus === 'APPROVED'
            ? '重新提交资料'
            : '立即去认证'
        }}
      </button>
      <button v-else class="secondary-btn flex-1 animate-btn" @click="load">刷新状态</button>
    </view>
  </view>
</template>

<script>
import { api, requireLogin } from '../../utils/api.js';
import { dateText, reviewStatusText } from '../../utils/format.js';

export default {
  data() {
    return {
      status: { reviewStatus: 'UNVERIFIED' },
      verification: {},
      mediaFiles: [],
      reviewStatusText,
    };
  },
  computed: {
    statusIcon() {
      const icons = {
        APPROVED: '/static/icons/check-circle.svg',
        PENDING: '/static/icons/clock.svg',
        REJECTED: '/static/icons/x-circle.svg',
      };
      return icons[this.status.reviewStatus] || '';
    },
    rejectReasonText() {
      return String(this.status.rejectReason || '').trim();
    },
    showRejectReason() {
      return this.status.reviewStatus === 'REJECTED' && Boolean(this.rejectReasonText);
    },
    hasVerificationVersion() {
      return Boolean(this.verification.id);
    },
    businessLicenseFiles() {
      return this.filesByUsage('BUSINESS_LICENSE');
    },
    identityFiles() {
      const legalFiles = this.filesByUsages(['LEGAL_ID_FRONT', 'LEGAL_ID_BACK']);
      const agentFiles = this.filesByUsages(['AGENT_ID_FRONT', 'AGENT_ID_BACK']);
      return this.verification.verificationMethod === 'AUTHORIZED_AGENT' ? agentFiles : legalFiles;
    },
    authorizationLetterFiles() {
      return this.filesByUsage('AUTHORIZATION_LETTER');
    },
    roadLicenseFiles() {
      return this.filesByUsage('ROAD_LICENSE');
    },
    operationSiteFiles() {
      return this.filesByUsage('OPERATION_SITE');
    },
    regionText() {
      const parts = [
        this.verification.officeProvinceName,
        this.verification.officeCityName,
        this.verification.officeDistrictName,
      ].filter(Boolean);
      return parts.length ? parts.join(' · ') : '-';
    },
    addressText() {
      const parts = [this.verification.officePoiName, this.verification.officeAddressDetail].filter(
        Boolean,
      );
      return parts.length ? parts.join(' / ') : '-';
    },
    coordinateText() {
      if (!this.verification.officeLongitude || !this.verification.officeLatitude) {
        return '-';
      }
      return `${this.verification.officeLongitude}, ${this.verification.officeLatitude}`;
    },
    largeTruckLicense() {
      return this.verification.largeTruckLicense || {};
    },
    licenseDateRangeText() {
      const from = this.largeTruckLicense.licenseValidFrom || this.largeTruckLicense.startDate;
      const to = this.largeTruckLicense.licenseValidTo || this.largeTruckLicense.endDate;
      if (!from && !to) return '-';
      return `${from || '-'} 至 ${to || '-'}`;
    },
    showLargeTruckSection() {
      return (
        this.hasVerificationVersion &&
        (this.verification.serviceCapabilities || []).includes('LARGE_TRUCK')
      );
    },
  },
  onShow() {
    if (requireLogin()) this.load();
  },
  methods: {
    dateText,
    async load() {
      try {
        const status = await api.verificationStatus();
        this.status = status;
        if (status.reviewStatus === 'UNVERIFIED' && !status.submittedAt) {
          this.verification = {};
          this.mediaFiles = [];
          return;
        }

        const detail = await api.verificationDetail(
          status.pendingVersionId ? { versionId: status.pendingVersionId } : {},
        );
        this.applyVerificationDetail(detail);
      } catch (error) {
        console.error(error);
      }
    },
    applyVerificationDetail(detail) {
      const version = detail.version || null;
      if (!version) {
        this.verification = {};
        this.mediaFiles = [];
        return;
      }
      const snapshot = version.snapshotData || {};
      const largeTruckLicense = snapshot.largeTruckLicense || {};
      const serviceCapabilities =
        snapshot.serviceCapabilities ||
        this.status.serviceCapabilities ||
        this.companyTypeToCapabilities(snapshot.companyType || version.companyType);

      this.verification = {
        id: version.id,
        companyName: snapshot.companyName || version.companyName || this.status.companyName,
        companyType: snapshot.companyType || version.companyType || this.status.companyType,
        creditCode: snapshot.creditCode || version.creditCode,
        legalRepresentativeName:
          snapshot.legalRepresentativeName || version.legalRepresentativeName,
        businessLicenseFileId: snapshot.businessLicenseFileId,
        serviceCapabilities,
        verificationMethod: snapshot.verificationMethod || version.verificationMethod,
        legalIdNumber: snapshot.legalIdNumber || version.legalIdNumber,
        agentName: snapshot.agentName || version.agentName,
        agentIdNumber: snapshot.agentIdNumber || version.agentIdNumber,
        officeProvinceName: snapshot.officeProvinceName || version.officeProvinceName,
        officeCityName: snapshot.officeCityName || version.officeCityName,
        officeDistrictName: snapshot.officeDistrictName || version.officeDistrictName,
        officePoiName: snapshot.officePoiName || version.officePoiName,
        officeAddressDetail:
          snapshot.officeAddressDetail || snapshot.officeAddress || version.officeAddressDetail,
        officeLongitude: snapshot.officeLongitude || version.officeLongitude,
        officeLatitude: snapshot.officeLatitude || version.officeLatitude,
        largeTruckLicense: {
          licenseHolderName:
            largeTruckLicense.licenseHolderName ||
            largeTruckLicense.ownerName ||
            version.licenseHolderName,
          licenseNumber:
            largeTruckLicense.licenseNumber || largeTruckLicense.licenseNo || version.licenseNumber,
          licenseValidFrom:
            largeTruckLicense.licenseValidFrom ||
            largeTruckLicense.startDate ||
            this.dateOnly(version.licenseValidFrom),
          licenseValidTo:
            largeTruckLicense.licenseValidTo ||
            largeTruckLicense.endDate ||
            this.dateOnly(version.licenseValidTo),
        },
        submittedAt: version.submittedAt,
        reviewedAt: version.reviewedAt,
      };
      this.mediaFiles = (version.mediaFiles || []).filter((file) => file.fileUrl);
    },
    dateOnly(value) {
      if (!value) return '';
      return String(value).split('T')[0];
    },
    safeText(value) {
      return value === undefined || value === null || value === '' ? '未填写' : value;
    },
    formatCompanyType(companyType, caps = []) {
      if (companyType === 'CAR_CARRIER' || caps.includes('LARGE_TRUCK')) {
        return '轿运公司';
      }
      if (companyType === 'ROADSIDE_RESCUE' || caps.includes('SMALL_TRUCK')) {
        return '道路救援公司';
      }
      return '';
    },
    companyTypeToCapabilities(type) {
      if (type === 'CAR_CARRIER') return ['LARGE_TRUCK', 'SMALL_TRUCK'];
      if (type === 'ROADSIDE_RESCUE') return ['SMALL_TRUCK'];
      return [];
    },
    serviceCapabilitiesText(caps = []) {
      const labels = {
        LARGE_TRUCK: '大板线路',
        SMALL_TRUCK: '小板线路',
        DRIVING: '代驾',
      };
      const text = caps.map((cap) => labels[cap] || cap).filter(Boolean);
      return text.length ? text.join('、') : '未填写';
    },
    verificationMethodText(method) {
      if (method === 'LEGAL_REPRESENTATIVE') return '法定代表人自办';
      if (method === 'AUTHORIZED_AGENT') return '经办人/委托人办理';
      return '未填写';
    },
    fileUsageText(usageScene) {
      const labels = {
        BUSINESS_LICENSE: '营业执照',
        LEGAL_ID_FRONT: '法人身份证人像面',
        LEGAL_ID_BACK: '法人身份证国徽面',
        AGENT_ID_FRONT: '经办人身份证正面',
        AGENT_ID_BACK: '经办人身份证反面',
        AUTHORIZATION_LETTER: '授权委托书',
        ROAD_LICENSE: '道路运输许可证',
        OPERATION_SITE: '场地照片',
      };
      return labels[usageScene] || '图片';
    },
    filesByUsage(usageScene) {
      return this.mediaFiles.filter((file) => file.usageScene === usageScene);
    },
    filesByUsages(usageScenes) {
      return this.mediaFiles.filter((file) => usageScenes.includes(file.usageScene));
    },
    previewFiles(files, currentUrl) {
      const urls = files.map((file) => file.fileUrl).filter(Boolean);
      if (!urls.length) return;
      uni.previewImage({ urls, current: currentUrl || urls[0] });
    },
    goHome() {
      uni.switchTab({ url: '/pages/home/index' });
    },
    goForm() {
      uni.navigateTo({ url: '/pages/verification/form' });
    },
  },
};
</script>

<style>
.status-page {
  padding: 30rpx;
  padding-bottom: calc(150rpx + env(safe-area-inset-bottom));
  background: #f1f6fc;
}

.status-banner-card {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
  min-height: 146rpx;
  padding: 30rpx 32rpx;
  border-radius: 18rpx;
  margin-bottom: 24rpx;
  border: 1rpx solid rgba(229, 231, 235, 0.75);
  box-shadow: 0 12rpx 28rpx rgba(15, 23, 42, 0.04);
  background: #ffffff;
}

.status-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4rpx;
}

.status-icon-image {
  width: 72rpx;
  height: 72rpx;
}

.status-banner-meta {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  min-width: 0;
}

.status-title-text {
  font-size: 36rpx;
  font-weight: 800;
  color: #111827;
  line-height: 1.2;
}

.status-subtitle-text {
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.45;
}

.inline-reject-reason {
  margin-top: 14rpx;
  padding: 18rpx 20rpx;
  border-radius: 12rpx;
  background: rgba(255, 255, 255, 0.72);
  border: 1rpx solid #fee2e2;
}

.inline-reject-label {
  display: block;
  margin-bottom: 6rpx;
  color: #dc2626;
  font-size: 22rpx;
  font-weight: 800;
}

.inline-reject-text {
  display: block;
  color: #374151;
  font-size: 26rpx;
  line-height: 1.45;
  word-break: break-word;
  white-space: pre-wrap;
}

/* Status variants */
.status-banner-card.approved {
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
  border-color: #bbf7d0;
}
.status-banner-card.approved .status-title-text {
  color: #16a34a;
}

.status-banner-card.pending {
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
  border-color: #bfdbfe;
}
.status-banner-card.pending .status-title-text {
  color: #1677ff;
}

.status-banner-card.rejected {
  background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
  border-color: #fecaca;
}
.status-banner-card.rejected .status-title-text {
  color: #dc2626;
}

.status-banner-card.unverified {
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  border-color: #e2e8f0;
}
.status-banner-card.unverified .status-icon-wrap {
  background: #e2e8f0;
  color: #64748b;
}

.info-card {
  padding-bottom: 12rpx;
}

.info-list {
  display: flex;
  flex-direction: column;
}

.info-row-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24rpx;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f1f5f9;
  font-size: 26rpx;
}

.column-row {
  align-items: flex-start;
}

.info-row-item:last-child {
  border-bottom: 0;
}

.row-label {
  flex-shrink: 0;
  color: var(--text-muted);
}

.row-value {
  min-width: 0;
  color: var(--text-main);
  font-weight: 700;
  text-align: right;
  word-break: break-all;
}

.multiline-value {
  line-height: 1.5;
  white-space: normal;
}

.file-group {
  margin-top: 28rpx;
  padding-top: 28rpx;
  border-top: 1rpx solid #f1f5f9;
}

.file-group-title {
  margin-bottom: 18rpx;
  color: var(--text-main);
  font-size: 26rpx;
  font-weight: 700;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16rpx;
}

.file-thumb,
.file-item {
  min-width: 0;
}

.file-image {
  width: 100%;
  height: 150rpx;
  border-radius: 12rpx;
  background: #f8fafc;
  border: 1rpx solid #e5e7eb;
}

.file-label {
  display: block;
  margin-top: 8rpx;
  color: var(--text-muted);
  font-size: 20rpx;
  line-height: 1.3;
  text-align: center;
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  margin-top: 12rpx;
}

.guide-step {
  display: flex;
  gap: 24rpx;
  align-items: flex-start;
}

.step-num {
  font-size: 36rpx;
  font-weight: 900;
  color: #93c5fd;
  line-height: 1;
}

.step-meta {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.step-title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--text-main);
}

.step-desc {
  font-size: 24rpx;
  color: var(--text-muted);
  line-height: 1.5;
}

.button-row {
  display: flex;
  gap: 20rpx;
}
</style>
