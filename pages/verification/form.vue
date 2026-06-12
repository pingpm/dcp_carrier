<template>
  <view class="page form-page">
    <scroll-view class="form-scroll" scroll-y show-scrollbar="false">
      <view class="form-content">
        <view class="form-header">
          <view class="form-header-title">承运商资质认证</view>
          <view class="form-header-desc"
            >请根据您实际能提供的服务如实提交资质信息，平台将在1-2个工作日内审核完毕。</view
          >
        </view>

        <!-- Company Type -->
        <view class="section">
          <view class="section-title">运输公司类型 <text class="required">*</text></view>
          <view class="company-type-grid">
            <view
              class="company-type-card car-carrier"
              :class="{ checked: companyType === 'CAR_CARRIER' }"
              @click="setCompanyType('CAR_CARRIER')"
            >
              <image class="company-type-bg" src="/static/large_truck.svg" mode="aspectFit" />
              <view class="company-type-body">
                <view class="company-type-title-row">
                  <text class="company-type-title">轿运公司</text>
                </view>
                <text class="company-type-desc">多车型运营，含大板车和道路救援车。</text>
                <view class="company-type-tags">
                  <text class="company-type-tag">大板线路</text>
                  <text class="company-type-tag">小板线路</text>
                </view>
              </view>
              <image
                class="company-type-choose"
                :src="
                  companyType === 'CAR_CARRIER'
                    ? '/static/bottom_right_choose_selected.svg'
                    : '/static/bottom_right_choose.svg'
                "
                mode="aspectFit"
              />
            </view>

            <view
              class="company-type-card roadside-rescue"
              :class="{ checked: companyType === 'ROADSIDE_RESCUE' }"
              @click="setCompanyType('ROADSIDE_RESCUE')"
            >
              <image class="company-type-bg" src="/static/small_truck.svg" mode="aspectFit" />
              <view class="company-type-body">
                <view class="company-type-title-row">
                  <text class="company-type-title">道路救援公司</text>
                </view>
                <text class="company-type-desc">仅道路救援车辆（小板车）运营。</text>
                <view class="company-type-tags">
                  <text class="company-type-tag">仅小板线路</text>
                </view>
              </view>
              <image
                class="company-type-choose"
                :src="
                  companyType === 'ROADSIDE_RESCUE'
                    ? '/static/bottom_right_choose_selected.svg'
                    : '/static/bottom_right_choose.svg'
                "
                mode="aspectFit"
              />
            </view>
          </view>
          <view
            class="subtle"
            style="margin-top: 16rpx; color: #ef4444"
            v-if="removedCapabilitiesWarning"
          >
            警告：修改公司类型导致服务能力减少时，资质通过后将自动关闭不再支持的运输线路。
          </view>
        </view>

        <!-- Basic Corporate Info -->
        <view class="section">
          <view class="section-title">企业基本信息</view>

          <view class="material-card">
            <view class="material-photo">
              <carrier-image-uploader
                :model-value="singleFile('businessLicenseFileId')"
                title="营业执照照片"
                usage-scene="BUSINESS_LICENSE"
                add-text="上传营业执照"
                single
                compact
                required
                :show-status="false"
                :example-src="exampleImages.carrierBusinessLicense"
                @update:modelValue="setSingleFile('businessLicenseFileId', $event)"
              />
            </view>

            <view class="material-fields">
              <view class="field">
                <text class="label">企业名称 <text class="required">*</text></text>
                <input
                  class="input"
                  v-model="form.companyName"
                  placeholder="请输入企业工商营业执照全称"
                  placeholder-style="color:#9ca3af"
                />
              </view>

              <view class="field">
                <text class="label">统一社会信用代码 <text class="required">*</text></text>
                <input
                  class="input"
                  v-model="form.creditCode"
                  placeholder="请输入18位统一社会信用代码"
                  placeholder-style="color:#9ca3af"
                  maxlength="18"
                />
              </view>

              <view class="field">
                <text class="label">法人名称 <text class="required">*</text></text>
                <input
                  class="input"
                  v-model="form.legalRepresentativeName"
                  placeholder="请输入法定代表人姓名"
                  placeholder-style="color:#9ca3af"
                />
              </view>
            </view>
          </view>
        </view>

        <!-- Office Address -->
        <view class="section">
          <view class="section-title">经营地址</view>

          <region-select-field
            label="所在省市"
            required
            title="选择办公经营省市"
            placeholder="点击选择所在省份与城市"
            :province-name="form.office.provinceName"
            :city-name="form.office.cityName"
            @select="onOfficeRegionSelect"
          />

          <view class="field">
            <text class="label">详细地址 <text class="required">*</text></text>
            <view
              class="picker-display address-detail-display"
              :class="{ disabled: !form.office.cityId }"
              @click="openAddressPicker"
            >
              <view v-if="form.office.poiName || form.office.address" class="address-summary">
                <text class="address-summary-name">{{
                  form.office.poiName || form.office.address
                }}</text>
                <text v-if="form.office.address" class="address-summary-detail">{{
                  form.office.address
                }}</text>
              </view>
              <text v-else style="color: #9ca3af">在地图上选择经营场地详细地址</text>
            </view>
          </view>
        </view>

        <!-- Verification Method -->
        <view class="section">
          <view class="section-title">身份认证方式 <text class="required">*</text></view>
          <view class="grid-two identity-method-grid">
            <view
              class="check-row identity-method-card"
              :class="{ checked: form.verificationMethod === 'LEGAL_REPRESENTATIVE' }"
              @click="setVerificationMethod('LEGAL_REPRESENTATIVE')"
            >
              <text class="radio-icon-box">{{
                form.verificationMethod === 'LEGAL_REPRESENTATIVE' ? '●' : ''
              }}</text>
              <text>法定代表人自办</text>
            </view>
            <view
              class="check-row identity-method-card"
              :class="{ checked: form.verificationMethod === 'AUTHORIZED_AGENT' }"
              @click="setVerificationMethod('AUTHORIZED_AGENT')"
            >
              <text class="radio-icon-box">{{
                form.verificationMethod === 'AUTHORIZED_AGENT' ? '●' : ''
              }}</text>
              <text>经办人/委托人办理</text>
            </view>
          </view>

          <view
            v-if="form.verificationMethod === 'LEGAL_REPRESENTATIVE'"
            class="identity-detail-block"
          >
            <view class="identity-detail-title">法人身份证件</view>
            <view class="grid-two">
              <!-- Front -->
              <view class="upload-block">
                <carrier-image-uploader
                  :model-value="singleFile('legalIdFrontFileId')"
                  title="身份证人像面"
                  usage-scene="IDENTITY_CARD"
                  add-text="上传人像面"
                  single
                  required
                  :show-status="false"
                  :example-src="exampleImages.carrierIdentityCard"
                  @update:modelValue="setSingleFile('legalIdFrontFileId', $event)"
                />
              </view>

              <!-- Back -->
              <view class="upload-block">
                <carrier-image-uploader
                  :model-value="singleFile('legalIdBackFileId')"
                  title="身份证国徽面"
                  usage-scene="IDENTITY_CARD"
                  add-text="上传国徽面"
                  single
                  required
                  :show-status="false"
                  :example-src="exampleImages.carrierIdentityCard"
                  @update:modelValue="setSingleFile('legalIdBackFileId', $event)"
                />
              </view>
            </view>

            <view class="field">
              <text class="label">法人姓名 <text class="required">*</text></text>
              <input
                class="input readonly-input"
                :value="form.legalRepresentativeName"
                placeholder="请先填写企业基本信息中的法人名称"
                placeholder-style="color:#9ca3af"
                disabled
              />
            </view>

            <view class="field">
              <text class="label">法人身份证号 <text class="required">*</text></text>
              <input
                class="input"
                v-model="form.legalIdNumber"
                placeholder="请输入法人18位身份证号"
                placeholder-style="color:#9ca3af"
                maxlength="18"
              />
            </view>
          </view>

          <view v-else class="identity-detail-block">
            <view class="identity-detail-title">委托经办人信息</view>
            <view class="grid-two">
              <!-- Front -->
              <view class="upload-block">
                <carrier-image-uploader
                  :model-value="singleFile('agentIdFrontFileId')"
                  title="经办人身份证正面"
                  usage-scene="IDENTITY_CARD"
                  add-text="上传正面"
                  single
                  required
                  :show-status="false"
                  :example-src="exampleImages.carrierIdentityCard"
                  @update:modelValue="setSingleFile('agentIdFrontFileId', $event)"
                />
              </view>

              <!-- Back -->
              <view class="upload-block">
                <carrier-image-uploader
                  :model-value="singleFile('agentIdBackFileId')"
                  title="经办人身份证反面"
                  usage-scene="IDENTITY_CARD"
                  add-text="上传反面"
                  single
                  required
                  :show-status="false"
                  :example-src="exampleImages.carrierIdentityCard"
                  @update:modelValue="setSingleFile('agentIdBackFileId', $event)"
                />
              </view>
            </view>

            <view class="field">
              <text class="label">经办人姓名 <text class="required">*</text></text>
              <input
                class="input"
                v-model="form.agentName"
                placeholder="请输入经办人真实姓名"
                placeholder-style="color:#9ca3af"
              />
            </view>

            <view class="field">
              <text class="label">经办人身份证号 <text class="required">*</text></text>
              <input
                class="input"
                v-model="form.agentIdNumber"
                placeholder="请输入经办人18位身份证号"
                placeholder-style="color:#9ca3af"
                maxlength="18"
              />
            </view>

            <!-- Authorization Letter -->
            <view class="upload-block" style="margin-top: 24rpx">
              <carrier-image-uploader
                :model-value="singleFile('authorizationLetterFileId')"
                title="授权委托书 (加盖公章)"
                usage-scene="AUTHORIZATION_LETTER"
                add-text="上传委托书"
                single
                required
                :show-status="false"
                :example-src="exampleImages.carrierAuthorizationLetter"
                @update:modelValue="setSingleFile('authorizationLetterFileId', $event)"
              />
            </view>
          </view>
        </view>

        <!-- Road Transport License -->
        <view class="section" v-if="form.serviceCapabilities.includes('LARGE_TRUCK')">
          <view class="section-title">道路运输许可信息</view>

          <view class="material-card">
            <view class="material-photo">
              <carrier-image-uploader
                :model-value="largeTruckLicenseFile"
                title="道路运输许可证照片"
                usage-scene="ROAD_LICENSE"
                add-text="上传许可证"
                single
                compact
                required
                :show-status="false"
                :example-src="exampleImages.carrierRoadLicense"
                @update:modelValue="setLargeTruckLicenseFile"
              />
            </view>

            <view class="material-fields">
              <view class="field">
                <text class="label"
                  >道路运输经营许可证业户名称 <text class="required">*</text></text
                >
                <input
                  class="input"
                  v-model="form.largeTruckLicense.ownerName"
                  placeholder="请输入许可证上的业户名称"
                  placeholder-style="color:#9ca3af"
                />
              </view>

              <view class="field">
                <text class="label">许可证字号 <text class="required">*</text></text>
                <input
                  class="input"
                  v-model="form.largeTruckLicense.licenseNo"
                  placeholder="请输入道路运输经营许可证字号"
                  placeholder-style="color:#9ca3af"
                />
              </view>

              <view class="grid-two">
                <view class="field">
                  <text class="label">证件有效期起 <text class="required">*</text></text>
                  <picker mode="date" @change="onDateChange($event, 'startDate')">
                    <view class="picker-display">
                      <text>{{ form.largeTruckLicense.startDate || '选择开始日期' }}</text>
                    </view>
                  </picker>
                </view>

                <view class="field">
                  <text class="label">证件有效期止 <text class="required">*</text></text>
                  <picker mode="date" @change="onDateChange($event, 'endDate')">
                    <view class="picker-display">
                      <text>{{ form.largeTruckLicense.endDate || '选择结束日期' }}</text>
                    </view>
                  </picker>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- Office / Yard Images -->
        <view class="section" v-if="form.serviceCapabilities.includes('LARGE_TRUCK')">
          <view class="section-title">办公场地信息</view>

          <carrier-image-uploader
            v-model="siteFiles"
            title="办公/场地经营照片"
            tip="请上传1至9张经营场所实景照片"
            usage-scene="OPERATION_SITE"
            :max-count="9"
            add-text="上传场所照"
            required
            compact
            :example-src="exampleImages.carrierOperationSite"
          />
        </view>
      </view>
    </scroll-view>

    <address-map-picker ref="addressMapPicker" title="选择详细地址" @select="confirmAddressPicker" />

    <!-- Fixed Action Footer -->
    <view class="fixed-footer">
      <button class="primary-btn" :loading="submitting" @click="submit">提交并申请认证</button>
    </view>
  </view>
</template>

<script>
import AddressMapPicker from '../../components/address-map-picker/address-map-picker.vue';
import CarrierImageUploader from '../../components/carrier-image-uploader/carrier-image-uploader.vue';
import RegionSelectField from '../../components/region-select-field/region-select-field.vue';
import { api, requireLogin } from '../../utils/api.js';

export default {
  components: {
    AddressMapPicker,
    CarrierImageUploader,
    RegionSelectField,
  },
  data() {
    return {
      // Historical capabilities (if already approved)
      originalCapabilities: [],
      form: {
        companyName: '',
        creditCode: '',
        legalRepresentativeName: '',
        businessLicenseFileId: '',
        serviceCapabilities: [], // LARGE_TRUCK, SMALL_TRUCK
        verificationMethod: 'LEGAL_REPRESENTATIVE', // LEGAL_REPRESENTATIVE, AUTHORIZED_AGENT
        office: {
          provinceId: '',
          provinceName: '',
          cityId: '',
          cityName: '',
          districtId: '',
          districtName: '',
          poiName: '',
          address: '',
          locationLng: '',
          locationLat: '',
        },

        legalIdNumber: '',
        legalIdFrontFileId: '',
        legalIdBackFileId: '',

        agentName: '',
        agentIdNumber: '',
        agentIdFrontFileId: '',
        agentIdBackFileId: '',
        authorizationLetterFileId: '',

        largeTruckLicense: {
          ownerName: '',
          licenseNo: '',
          licenseFileId: '',
          startDate: '',
          endDate: '',
        },
      },
      operationSiteFileIds: [],
      siteFiles: [], // Array of { fileId, fileUrl } for office photos

      // File URL temporary mappings for display
      urlsMap: {},
      exampleImages: {
        carrierBusinessLicense: '',
        carrierIdentityCard: '',
        carrierAuthorizationLetter: '',
        carrierRoadLicense: '',
        carrierOperationSite: '',
      },
      submitting: false,
    };
  },
  computed: {
    largeTruckLicenseFile() {
      const fileId = this.form.largeTruckLicense.licenseFileId;
      const fileUrl = this.urlsMap['largeTruckLicense.licenseFileId'];
      return fileId && fileUrl ? [{ fileId, fileUrl }] : [];
    },
    companyType() {
      if (this.form.serviceCapabilities.includes('LARGE_TRUCK')) return 'CAR_CARRIER';
      if (this.form.serviceCapabilities.includes('SMALL_TRUCK')) return 'ROADSIDE_RESCUE';
      return '';
    },
    removedCapabilitiesWarning() {
      if (!this.originalCapabilities.length) return false;
      return this.originalCapabilities.some((cap) => !this.form.serviceCapabilities.includes(cap));
    },
  },
  onLoad() {
    this.loadExampleImages();
    if (requireLogin()) this.loadDetail();
  },
  methods: {
    async loadExampleImages() {
      try {
        const data = await api.exampleImageConfigs();
        const byKey = {};
        (data.items || []).forEach((item) => {
          byKey[item.urlKey] = item;
        });
        this.exampleImages.carrierBusinessLicense = this.enabledExampleUrl(
          byKey.carrier_business_license_example_url,
        );
        this.exampleImages.carrierIdentityCard = this.enabledExampleUrl(
          byKey.carrier_identity_card_example_url,
        );
        this.exampleImages.carrierAuthorizationLetter = this.enabledExampleUrl(
          byKey.carrier_authorization_letter_example_url,
        );
        this.exampleImages.carrierRoadLicense = this.enabledExampleUrl(
          byKey.carrier_road_license_example_url,
        );
        this.exampleImages.carrierOperationSite = this.enabledExampleUrl(
          byKey.carrier_operation_site_example_url,
        );
      } catch (error) {
        this.exampleImages.carrierBusinessLicense = '';
        this.exampleImages.carrierIdentityCard = '';
        this.exampleImages.carrierAuthorizationLetter = '';
        this.exampleImages.carrierRoadLicense = '';
        this.exampleImages.carrierOperationSite = '';
      }
    },
    enabledExampleUrl(item) {
      return item?.enabled && item?.url ? item.url : '';
    },
    async loadDetail() {
      try {
        const detail = await api.verificationDetail();
        const profile = detail.profile || {};
        const snapshot = detail.version?.snapshotData || {};

        this.originalCapabilities = profile.serviceCapabilities || [];
        const savedCompanyType = snapshot.companyType || profile.companyType || '';
        const savedCapabilities =
          snapshot.serviceCapabilities ||
          profile.serviceCapabilities ||
          this.companyTypeToCapabilities(savedCompanyType);

        this.form = {
          companyName: snapshot.companyName || profile.companyName || '',
          creditCode: snapshot.creditCode || profile.creditCode || '',
          legalRepresentativeName:
            snapshot.legalRepresentativeName || profile.legalRepresentativeName || '',
          businessLicenseFileId: snapshot.businessLicenseFileId || '',
          serviceCapabilities: savedCapabilities,
          verificationMethod: snapshot.verificationMethod || 'LEGAL_REPRESENTATIVE',
          office: {
            provinceId: snapshot.officeProvinceId || '',
            provinceName: snapshot.officeProvinceName || '',
            cityId: snapshot.officeCityId || '',
            cityName: snapshot.officeCityName || '',
            districtId: snapshot.officeDistrictId || '',
            districtName: snapshot.officeDistrictName || '',
            poiName: snapshot.officePoiName || '',
            address: snapshot.officeAddress || snapshot.officeAddressDetail || '',
            locationLng: snapshot.officeLongitude || '',
            locationLat: snapshot.officeLatitude || '',
          },

          legalIdNumber: snapshot.legalIdNumber || '',
          legalIdFrontFileId: snapshot.legalIdFrontFileId || '',
          legalIdBackFileId: snapshot.legalIdBackFileId || '',

          agentName: snapshot.agentName || '',
          agentIdNumber: snapshot.agentIdNumber || '',
          agentIdFrontFileId: snapshot.agentIdFrontFileId || '',
          agentIdBackFileId: snapshot.agentIdBackFileId || '',
          authorizationLetterFileId: snapshot.authorizationLetterFileId || '',

          largeTruckLicense: {
            ownerName:
              (snapshot.largeTruckLicense &&
                (snapshot.largeTruckLicense.ownerName ||
                  snapshot.largeTruckLicense.licenseHolderName)) ||
              '',
            licenseNo:
              (snapshot.largeTruckLicense &&
                (snapshot.largeTruckLicense.licenseNo ||
                  snapshot.largeTruckLicense.licenseNumber)) ||
              '',
            licenseFileId:
              (snapshot.largeTruckLicense &&
                (snapshot.largeTruckLicense.licenseFileId ||
                  snapshot.largeTruckLicense.licensePhotoFileId)) ||
              '',
            startDate:
              (snapshot.largeTruckLicense &&
                (snapshot.largeTruckLicense.startDate ||
                  snapshot.largeTruckLicense.licenseValidFrom)) ||
              '',
            endDate:
              (snapshot.largeTruckLicense &&
                (snapshot.largeTruckLicense.endDate ||
                  snapshot.largeTruckLicense.licenseValidTo)) ||
              '',
          },
        };

        // Recover file URLs
        if (detail.version?.mediaFiles) {
          const media = detail.version.mediaFiles || [];
          media.forEach((m) => {
            if (m.usageScene === 'OPERATION_SITE') {
              this.siteFiles.push({ fileId: m.fileId, fileUrl: m.fileUrl });
            } else if (m.usageScene === 'ROAD_LICENSE') {
              this.urlsMap['largeTruckLicense.licenseFileId'] = m.fileUrl;
              this.form.largeTruckLicense.licenseFileId = m.fileId;
            } else if (m.usageScene === 'BUSINESS_LICENSE') {
              this.urlsMap.businessLicenseFileId = m.fileUrl;
              this.form.businessLicenseFileId = m.fileId;
            } else {
              const fileKey = this.getFileKeyFromId(m.fileId, snapshot);
              if (fileKey) {
                this.urlsMap[fileKey] = m.fileUrl;
              }
            }
          });
        }
      } catch (err) {
        console.error(err);
      }
    },
    getFileKeyFromId(id, snapshot) {
      if (snapshot.legalIdFrontFileId === id) return 'legalIdFrontFileId';
      if (snapshot.legalIdBackFileId === id) return 'legalIdBackFileId';
      if (snapshot.agentIdFrontFileId === id) return 'agentIdFrontFileId';
      if (snapshot.agentIdBackFileId === id) return 'agentIdBackFileId';
      if (snapshot.authorizationLetterFileId === id) return 'authorizationLetterFileId';
      return '';
    },
    setCompanyType(type) {
      this.form.serviceCapabilities = this.companyTypeToCapabilities(type);
    },
    companyTypeToCapabilities(type) {
      if (type === 'CAR_CARRIER') return ['LARGE_TRUCK', 'SMALL_TRUCK'];
      if (type === 'ROADSIDE_RESCUE') return ['SMALL_TRUCK'];
      return [];
    },
    setVerificationMethod(method) {
      this.form.verificationMethod = method;
    },
    onDateChange(e, key) {
      this.form.largeTruckLicense[key] = e.detail.value;
    },
    onOfficeRegionSelect(region) {
      const office = this.form.office;
      const cityChanged = String(office.cityId) !== String(region.cityId);
      office.provinceId = region.provinceId;
      office.provinceName = region.provinceName;
      office.cityId = region.cityId;
      office.cityName = region.cityName;
      office.districtId = '';
      office.districtName = '';
      if (cityChanged) {
        office.poiName = '';
        office.address = '';
        office.locationLng = '';
        office.locationLat = '';
      }
    },
    openAddressPicker() {
      const office = this.form.office;
      if (!office.cityId) {
        uni.showToast({ title: '请先选择办公经营省市', icon: 'none' });
        return;
      }
      this.$refs.addressMapPicker.open({
        name: office.poiName || '',
        address: office.address || '',
        provinceName: office.provinceName || '',
        cityName: office.cityName || '',
        lng: office.locationLng || '',
        lat: office.locationLat || '',
        districtName: office.districtName || '',
        districtId: office.districtId || '',
      });
    },
    confirmAddressPicker(address) {
      const name = (address.name || '').trim();
      if (!name) {
        uni.showToast({ title: '请选择详细地址', icon: 'none' });
        return;
      }
      const office = this.form.office;
      office.poiName = name;
      office.address = address.address || name;
      office.locationLng = address.lng || '';
      office.locationLat = address.lat || '';
      office.districtName = address.districtName || office.districtName;
      office.districtId = address.districtId || office.districtId;
    },
    singleFile(fieldKey) {
      const fileId = this.form[fieldKey];
      const fileUrl = this.urlsMap[fieldKey];
      return fileId && fileUrl ? [{ fileId, fileUrl }] : [];
    },
    setSingleFile(fieldKey, files) {
      const file = files[0];
      this.form[fieldKey] = file?.fileId || '';
      this.urlsMap[fieldKey] = file?.fileUrl || '';
    },
    setLargeTruckLicenseFile(files) {
      const file = files[0];
      this.form.largeTruckLicense.licenseFileId = file?.fileId || '';
      this.urlsMap['largeTruckLicense.licenseFileId'] = file?.fileUrl || '';
    },
    validate() {
      if (!this.form.companyName.trim()) {
        uni.showToast({ title: '请输入企业名称', icon: 'none' });
        return false;
      }
      if (!this.form.creditCode.trim() || this.form.creditCode.trim().length !== 18) {
        uni.showToast({ title: '请输入正确的18位信用代码', icon: 'none' });
        return false;
      }
      if (!this.form.legalRepresentativeName.trim()) {
        uni.showToast({ title: '请输入法人姓名', icon: 'none' });
        return false;
      }
      if (!this.form.businessLicenseFileId) {
        uni.showToast({ title: '请上传营业执照照片', icon: 'none' });
        return false;
      }
      if (!this.companyType) {
        uni.showToast({ title: '请选择运输公司类型', icon: 'none' });
        return false;
      }

      // Identity Check
      if (this.form.verificationMethod === 'LEGAL_REPRESENTATIVE') {
        if (!this.form.legalIdNumber.trim() || this.form.legalIdNumber.trim().length !== 18) {
          uni.showToast({ title: '请输入正确的法人身份证号', icon: 'none' });
          return false;
        }
        if (!this.form.legalIdFrontFileId || !this.form.legalIdBackFileId) {
          uni.showToast({ title: '请上传法人身份证正反面照片', icon: 'none' });
          return false;
        }
      } else {
        if (!this.form.agentName.trim()) {
          uni.showToast({ title: '请输入委托经办人姓名', icon: 'none' });
          return false;
        }
        if (!this.form.agentIdNumber.trim() || this.form.agentIdNumber.trim().length !== 18) {
          uni.showToast({ title: '请输入正确的经办人身份证号', icon: 'none' });
          return false;
        }
        if (
          !this.form.agentIdFrontFileId ||
          !this.form.agentIdBackFileId ||
          !this.form.authorizationLetterFileId
        ) {
          uni.showToast({ title: '请上传经办人正反面身份证和授权书', icon: 'none' });
          return false;
        }
      }

      const office = this.form.office;
      if (!office.provinceId || !office.cityId) {
        uni.showToast({ title: '请选择办公经营省市', icon: 'none' });
        return false;
      }
      if (!office.poiName.trim()) {
        uni.showToast({ title: '请选择办公经营地址名称', icon: 'none' });
        return false;
      }
      if (!office.address.trim()) {
        uni.showToast({ title: '请选择办公经营详细地址', icon: 'none' });
        return false;
      }
      if (!office.locationLng || !office.locationLat) {
        uni.showToast({ title: '请在地图上确认办公经营位置', icon: 'none' });
        return false;
      }

      // Large Truck License checks
      if (this.form.serviceCapabilities.includes('LARGE_TRUCK')) {
        const license = this.form.largeTruckLicense;
        if (!license.ownerName.trim()) {
          uni.showToast({ title: '请输入大板许可证业户名称', icon: 'none' });
          return false;
        }
        if (!license.licenseNo.trim()) {
          uni.showToast({ title: '请输入大板许可证字号', icon: 'none' });
          return false;
        }
        if (!license.startDate || !license.endDate) {
          uni.showToast({ title: '请选择许可证有效期起止时间', icon: 'none' });
          return false;
        }
        if (!license.licenseFileId) {
          uni.showToast({ title: '请上传许可证照片', icon: 'none' });
          return false;
        }
        if (!this.siteFiles.length) {
          uni.showToast({ title: '请至少上传一张办公/场地照片', icon: 'none' });
          return false;
        }
      }
      return true;
    },
    async submit() {
      if (!this.validate()) return;

      const proceed = () => {
        this.doSubmit();
      };

      if (this.removedCapabilitiesWarning) {
        uni.showModal({
          title: '公司类型变更提示',
          content:
            '由于您修改公司类型后减少了原有服务能力，资质通过后，不再支持的相关线路将被系统自动关闭，是否确认提交？',
          success(res) {
            if (res.confirm) proceed();
          },
        });
      } else {
        proceed();
      }
    },
    async doSubmit() {
      this.submitting = true;
      try {
        const payload = {
          companyName: this.form.companyName,
          companyType: this.companyType,
          creditCode: this.form.creditCode,
          legalRepresentativeName: this.form.legalRepresentativeName,
          businessLicenseFileId: this.form.businessLicenseFileId,
          serviceCapabilities: this.form.serviceCapabilities,
          verificationMethod: this.form.verificationMethod,
        };
        const office = this.form.office;
        payload.officeProvinceId = office.provinceId;
        payload.officeProvinceName = office.provinceName;
        payload.officeCityId = office.cityId;
        payload.officeCityName = office.cityName;
        payload.officeDistrictId = office.districtId;
        payload.officeDistrictName = office.districtName;
        payload.officePoiName = office.poiName;
        payload.officeAddressDetail = office.address;
        payload.officeLongitude = office.locationLng;
        payload.officeLatitude = office.locationLat;

        if (this.form.verificationMethod === 'LEGAL_REPRESENTATIVE') {
          payload.legalIdNumber = this.form.legalIdNumber;
          payload.legalIdFrontFileId = this.form.legalIdFrontFileId;
          payload.legalIdBackFileId = this.form.legalIdBackFileId;
        } else {
          payload.agentName = this.form.agentName;
          payload.agentIdNumber = this.form.agentIdNumber;
          payload.agentIdFrontFileId = this.form.agentIdFrontFileId;
          payload.agentIdBackFileId = this.form.agentIdBackFileId;
          payload.authorizationLetterFileId = this.form.authorizationLetterFileId;
        }

        if (this.form.serviceCapabilities.includes('LARGE_TRUCK')) {
          const license = this.form.largeTruckLicense;
          payload.largeTruckLicense = {
            ownerName: license.ownerName,
            licenseNo: license.licenseNo,
            licenseFileId: license.licenseFileId,
            startDate: license.startDate,
            endDate: license.endDate,
            licenseHolderName: license.ownerName,
            licenseNumber: license.licenseNo,
            licensePhotoFileId: license.licenseFileId,
            licenseValidFrom: license.startDate,
            licenseValidTo: license.endDate,
          };
          payload.operationSiteFileIds = this.siteFiles.map((f) => f.fileId);
        }

        await api.submitVerification(payload);
        uni.showToast({ title: '资质认证提交成功', icon: 'success' });
        setTimeout(() => {
          uni.redirectTo({ url: '/pages/verification/status' });
        }, 800);
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>

<style>
.form-page {
  height: 100vh;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}

.form-scroll {
  height: 100%;
}

.form-content {
  padding: 30rpx 30rpx calc(160rpx + env(safe-area-inset-bottom));
}

.form-header {
  margin-bottom: 36rpx;
  padding: 0 10rpx;
}

.form-header-title {
  font-size: 38rpx;
  font-weight: 800;
  color: #111827;
}

.form-header-desc {
  font-size: 24rpx;
  color: #6b7280;
  margin-top: 10rpx;
  line-height: 1.5;
}

.required {
  color: #ef4444;
  margin-left: 6rpx;
  font-weight: bold;
}

.company-type-grid {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.company-type-card {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 132rpx;
  padding: 18rpx 22rpx;
  border: 2rpx solid var(--border-color);
  border-radius: var(--radius-md);
  background: #f9fafb;
  overflow: hidden;
  transition: all 0.2s ease;
}

.company-type-card.checked {
  border-color: #93c5fd;
  background: var(--primary-light);
  box-shadow: 0 8rpx 18rpx rgba(22, 119, 255, 0.08);
}

.company-type-bg {
  position: absolute;
  right: 18rpx;
  bottom: 8rpx;
  width: 150rpx;
  height: 88rpx;
  opacity: 0.1;
  pointer-events: none;
}

.company-type-body {
  position: relative;
  z-index: 1;
  min-width: 0;
  flex: 1;
  padding-right: 42rpx;
}

.company-type-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 6rpx;
}

.company-type-title {
  color: var(--text-main);
  font-size: 28rpx;
  font-weight: 800;
}

.company-type-desc {
  display: block;
  color: var(--text-muted);
  font-size: 22rpx;
  line-height: 1.3;
}

.company-type-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 8rpx;
}

.company-type-tag {
  display: inline-flex;
  align-items: center;
  min-height: 34rpx;
  padding: 0 12rpx;
  border-radius: 999rpx;
  background: #eff6ff;
  color: var(--primary-color);
  font-size: 21rpx;
  font-weight: 700;
  line-height: 1;
}

.company-type-choose {
  position: absolute;
  right: -2rpx;
  bottom: -2rpx;
  z-index: 2;
  width: 58rpx;
  height: 58rpx;
  pointer-events: none;
}

.check-icon-box {
  width: 32rpx;
  height: 32rpx;
  border: 2rpx solid #d1d5db;
  border-radius: 6rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: bold;
}

.checked .check-icon-box {
  border-color: #1677ff;
  background-color: #1677ff;
  color: #ffffff;
}

.radio-icon-box {
  width: 32rpx;
  height: 32rpx;
  border: 2rpx solid #d1d5db;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16rpx;
  color: transparent;
}

.checked .radio-icon-box {
  border-color: #1677ff;
  color: #1677ff;
}

.identity-method-grid {
  margin-bottom: 28rpx;
}

.identity-method-card {
  min-height: 110rpx;
  padding: 22rpx 24rpx;
  font-size: 28rpx;
  line-height: 1.35;
}

.identity-method-card .radio-icon-box {
  flex-shrink: 0;
  width: 36rpx;
  height: 36rpx;
  font-size: 18rpx;
}

.identity-detail-block {
  padding-top: 28rpx;
  border-top: 1rpx solid #eef2f7;
}

.identity-detail-title {
  margin-bottom: 22rpx;
  color: #111827;
  font-size: 30rpx;
  font-weight: 800;
  line-height: 1.35;
}

.readonly-input {
  background: #f3f4f6;
  color: #6b7280;
}

.material-card {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  padding: 18rpx;
  border: 1rpx solid #eef2f7;
  border-radius: var(--radius-md);
  background: #ffffff;
}

.material-photo {
  width: 100%;
}

.material-fields {
  width: 100%;
}

.material-fields .field:last-child {
  margin-bottom: 0;
}

.material-upload {
  width: 220rpx;
  height: 220rpx;
}

.address-detail-display {
  min-height: 96rpx;
  height: auto;
  align-items: flex-start;
  padding-top: 22rpx;
  padding-bottom: 22rpx;
  line-height: 1.45;
  white-space: normal;
}

.address-detail-display.disabled {
  background: #f3f4f6;
  color: #9ca3af;
}

.address-summary {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  width: 100%;
}

.address-summary-name {
  color: #111827;
  font-size: 26rpx;
  font-weight: 700;
  line-height: 1.35;
}

.address-summary-detail {
  color: #6b7280;
  font-size: 23rpx;
  line-height: 1.45;
}

</style>
