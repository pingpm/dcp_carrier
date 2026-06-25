"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const AddressMapPicker = () => "../../components/address-map-picker/address-map-picker.js";
const CarrierImageUploader = () => "../../components/carrier-image-uploader/carrier-image-uploader.js";
const RegionSelectField = () => "../../components/region-select-field/region-select-field.js";
const _sfc_main = {
  components: {
    AddressMapPicker,
    CarrierImageUploader,
    RegionSelectField
  },
  data() {
    return {
      // Historical capabilities (if already approved)
      originalCapabilities: [],
      form: {
        companyName: "",
        creditCode: "",
        legalRepresentativeName: "",
        businessLicenseFileId: "",
        serviceCapabilities: [],
        // LARGE_TRUCK, SMALL_TRUCK
        verificationMethod: "LEGAL_REPRESENTATIVE",
        // LEGAL_REPRESENTATIVE, AUTHORIZED_AGENT
        office: {
          provinceId: "",
          provinceName: "",
          cityId: "",
          cityName: "",
          districtId: "",
          districtName: "",
          poiName: "",
          address: "",
          locationLng: "",
          locationLat: ""
        },
        legalIdNumber: "",
        legalIdFrontFileId: "",
        legalIdBackFileId: "",
        agentName: "",
        agentIdNumber: "",
        agentIdFrontFileId: "",
        agentIdBackFileId: "",
        authorizationLetterFileId: "",
        largeTruckLicense: {
          ownerName: "",
          licenseNo: "",
          licenseFileId: "",
          startDate: "",
          endDate: ""
        }
      },
      operationSiteFileIds: [],
      siteFiles: [],
      // Array of { fileId, fileUrl } for office photos
      // File URL temporary mappings for display
      urlsMap: {},
      exampleImages: {
        carrierBusinessLicense: "",
        carrierIdentityCard: "",
        carrierAuthorizationLetter: "",
        carrierRoadLicense: "",
        carrierOperationSite: ""
      },
      identityChecking: {
        companyName: false,
        creditCode: false
      },
      identityCheckedValue: {
        companyName: "",
        creditCode: ""
      },
      identityErrors: {
        companyName: "",
        creditCode: ""
      },
      submitting: false
    };
  },
  computed: {
    largeTruckLicenseFile() {
      const fileId = this.form.largeTruckLicense.licenseFileId;
      const fileUrl = this.urlsMap["largeTruckLicense.licenseFileId"];
      return fileId && fileUrl ? [{ fileId, fileUrl }] : [];
    },
    companyType() {
      if (this.form.serviceCapabilities.includes("LARGE_TRUCK"))
        return "CAR_CARRIER";
      if (this.form.serviceCapabilities.includes("SMALL_TRUCK"))
        return "ROADSIDE_RESCUE";
      return "";
    },
    removedCapabilitiesWarning() {
      if (!this.originalCapabilities.length)
        return false;
      return this.originalCapabilities.some((cap) => !this.form.serviceCapabilities.includes(cap));
    }
  },
  onLoad() {
    if (typeof common_vendor.index.hideModal === "function") {
      common_vendor.index.hideModal();
    }
    this.loadExampleImages();
    if (common_vendor.requireLogin())
      this.loadDetail();
  },
  methods: {
    async loadExampleImages() {
      try {
        const data = await common_vendor.api.exampleImageConfigs();
        const byKey = {};
        (data.items || []).forEach((item) => {
          byKey[item.urlKey] = item;
        });
        this.exampleImages.carrierBusinessLicense = this.enabledExampleUrl(
          byKey.carrier_business_license_example_url
        );
        this.exampleImages.carrierIdentityCard = this.enabledExampleUrl(
          byKey.carrier_identity_card_example_url
        );
        this.exampleImages.carrierAuthorizationLetter = this.enabledExampleUrl(
          byKey.carrier_authorization_letter_example_url
        );
        this.exampleImages.carrierRoadLicense = this.enabledExampleUrl(
          byKey.carrier_road_license_example_url
        );
        this.exampleImages.carrierOperationSite = this.enabledExampleUrl(
          byKey.carrier_operation_site_example_url
        );
      } catch (error) {
        this.exampleImages.carrierBusinessLicense = "";
        this.exampleImages.carrierIdentityCard = "";
        this.exampleImages.carrierAuthorizationLetter = "";
        this.exampleImages.carrierRoadLicense = "";
        this.exampleImages.carrierOperationSite = "";
      }
    },
    enabledExampleUrl(item) {
      return (item == null ? void 0 : item.enabled) && (item == null ? void 0 : item.url) ? item.url : "";
    },
    clearIdentityError(fieldName) {
      this.identityErrors[fieldName] = "";
      this.identityCheckedValue[fieldName] = "";
    },
    async checkCompanyNameUsed() {
      const companyName = this.form.companyName.trim();
      if (!companyName || this.identityChecking.companyName)
        return false;
      if (this.identityCheckedValue.companyName === companyName)
        return false;
      this.identityChecking.companyName = true;
      try {
        const result = await common_vendor.api.verificationIdentityCheck({ companyName });
        this.identityCheckedValue.companyName = companyName;
        if (result.companyNameUsed) {
          this.identityErrors.companyName = "企业名称已被使用，请核对后更换";
          common_vendor.index.showToast({ title: this.identityErrors.companyName, icon: "none" });
          return true;
        }
        this.identityErrors.companyName = "";
        return false;
      } catch (error) {
        return false;
      } finally {
        this.identityChecking.companyName = false;
      }
    },
    async checkCreditCodeUsed() {
      const creditCode = this.form.creditCode.trim();
      if (!creditCode || creditCode.length !== 18 || this.identityChecking.creditCode) {
        return false;
      }
      if (this.identityCheckedValue.creditCode === creditCode)
        return false;
      this.identityChecking.creditCode = true;
      try {
        const result = await common_vendor.api.verificationIdentityCheck({ creditCode });
        this.identityCheckedValue.creditCode = creditCode;
        if (result.creditCodeUsed) {
          this.identityErrors.creditCode = "统一社会信用代码已被使用，请核对后更换";
          common_vendor.index.showToast({ title: this.identityErrors.creditCode, icon: "none" });
          return true;
        }
        this.identityErrors.creditCode = "";
        return false;
      } catch (error) {
        return false;
      } finally {
        this.identityChecking.creditCode = false;
      }
    },
    async loadDetail() {
      var _a, _b;
      try {
        const detail = await common_vendor.api.verificationDetail();
        const profile = detail.profile || {};
        const snapshot = ((_a = detail.version) == null ? void 0 : _a.snapshotData) || {};
        this.originalCapabilities = profile.serviceCapabilities || [];
        const savedCompanyType = snapshot.companyType || profile.companyType || "";
        const savedCapabilities = snapshot.serviceCapabilities || profile.serviceCapabilities || this.companyTypeToCapabilities(savedCompanyType);
        this.form = {
          companyName: snapshot.companyName || profile.companyName || "",
          creditCode: snapshot.creditCode || profile.creditCode || "",
          legalRepresentativeName: snapshot.legalRepresentativeName || profile.legalRepresentativeName || "",
          businessLicenseFileId: snapshot.businessLicenseFileId || "",
          serviceCapabilities: savedCapabilities,
          verificationMethod: snapshot.verificationMethod || "LEGAL_REPRESENTATIVE",
          office: {
            provinceId: snapshot.officeProvinceId || "",
            provinceName: snapshot.officeProvinceName || "",
            cityId: snapshot.officeCityId || "",
            cityName: snapshot.officeCityName || "",
            districtId: snapshot.officeDistrictId || "",
            districtName: snapshot.officeDistrictName || "",
            poiName: snapshot.officePoiName || "",
            address: snapshot.officeAddress || snapshot.officeAddressDetail || "",
            locationLng: snapshot.officeLongitude || "",
            locationLat: snapshot.officeLatitude || ""
          },
          legalIdNumber: snapshot.legalIdNumber || "",
          legalIdFrontFileId: snapshot.legalIdFrontFileId || "",
          legalIdBackFileId: snapshot.legalIdBackFileId || "",
          agentName: snapshot.agentName || "",
          agentIdNumber: snapshot.agentIdNumber || "",
          agentIdFrontFileId: snapshot.agentIdFrontFileId || "",
          agentIdBackFileId: snapshot.agentIdBackFileId || "",
          authorizationLetterFileId: snapshot.authorizationLetterFileId || "",
          largeTruckLicense: {
            ownerName: snapshot.largeTruckLicense && (snapshot.largeTruckLicense.ownerName || snapshot.largeTruckLicense.licenseHolderName) || "",
            licenseNo: snapshot.largeTruckLicense && (snapshot.largeTruckLicense.licenseNo || snapshot.largeTruckLicense.licenseNumber) || "",
            licenseFileId: snapshot.largeTruckLicense && (snapshot.largeTruckLicense.licenseFileId || snapshot.largeTruckLicense.licensePhotoFileId) || "",
            startDate: snapshot.largeTruckLicense && (snapshot.largeTruckLicense.startDate || snapshot.largeTruckLicense.licenseValidFrom) || "",
            endDate: snapshot.largeTruckLicense && (snapshot.largeTruckLicense.endDate || snapshot.largeTruckLicense.licenseValidTo) || ""
          }
        };
        if ((_b = detail.version) == null ? void 0 : _b.mediaFiles) {
          const media = detail.version.mediaFiles || [];
          media.forEach((m) => {
            if (m.usageScene === "OPERATION_SITE") {
              this.siteFiles.push({ fileId: m.fileId, fileUrl: m.fileUrl });
            } else if (m.usageScene === "ROAD_LICENSE") {
              this.urlsMap["largeTruckLicense.licenseFileId"] = m.fileUrl;
              this.form.largeTruckLicense.licenseFileId = m.fileId;
            } else if (m.usageScene === "BUSINESS_LICENSE") {
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
      if (snapshot.legalIdFrontFileId === id)
        return "legalIdFrontFileId";
      if (snapshot.legalIdBackFileId === id)
        return "legalIdBackFileId";
      if (snapshot.agentIdFrontFileId === id)
        return "agentIdFrontFileId";
      if (snapshot.agentIdBackFileId === id)
        return "agentIdBackFileId";
      if (snapshot.authorizationLetterFileId === id)
        return "authorizationLetterFileId";
      return "";
    },
    setCompanyType(type) {
      this.form.serviceCapabilities = this.companyTypeToCapabilities(type);
    },
    companyTypeToCapabilities(type) {
      if (type === "CAR_CARRIER")
        return ["LARGE_TRUCK", "SMALL_TRUCK"];
      if (type === "ROADSIDE_RESCUE")
        return ["SMALL_TRUCK"];
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
      office.districtId = "";
      office.districtName = "";
      if (cityChanged) {
        office.poiName = "";
        office.address = "";
        office.locationLng = "";
        office.locationLat = "";
      }
    },
    openAddressPicker() {
      const office = this.form.office;
      if (!office.cityId) {
        common_vendor.index.showToast({ title: "请先选择办公经营省市", icon: "none" });
        return;
      }
      this.$refs.addressMapPicker.open({
        name: office.poiName || "",
        address: office.address || "",
        provinceName: office.provinceName || "",
        cityName: office.cityName || "",
        lng: office.locationLng || "",
        lat: office.locationLat || "",
        districtName: office.districtName || "",
        districtId: office.districtId || ""
      });
    },
    confirmAddressPicker(address) {
      const name = (address.name || "").trim();
      if (!name) {
        common_vendor.index.showToast({ title: "请选择详细地址", icon: "none" });
        return;
      }
      const office = this.form.office;
      office.poiName = name;
      office.address = address.address || name;
      office.locationLng = address.lng || "";
      office.locationLat = address.lat || "";
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
      this.form[fieldKey] = (file == null ? void 0 : file.fileId) || "";
      this.urlsMap[fieldKey] = (file == null ? void 0 : file.fileUrl) || "";
    },
    setLargeTruckLicenseFile(files) {
      const file = files[0];
      this.form.largeTruckLicense.licenseFileId = (file == null ? void 0 : file.fileId) || "";
      this.urlsMap["largeTruckLicense.licenseFileId"] = (file == null ? void 0 : file.fileUrl) || "";
    },
    validate() {
      if (!this.form.companyName.trim()) {
        common_vendor.index.showToast({ title: "请输入企业名称", icon: "none" });
        return false;
      }
      if (this.identityErrors.companyName) {
        common_vendor.index.showToast({ title: this.identityErrors.companyName, icon: "none" });
        return false;
      }
      if (!this.form.creditCode.trim() || this.form.creditCode.trim().length !== 18) {
        common_vendor.index.showToast({ title: "请输入正确的18位信用代码", icon: "none" });
        return false;
      }
      if (this.identityErrors.creditCode) {
        common_vendor.index.showToast({ title: this.identityErrors.creditCode, icon: "none" });
        return false;
      }
      if (!this.form.legalRepresentativeName.trim()) {
        common_vendor.index.showToast({ title: "请输入法人姓名", icon: "none" });
        return false;
      }
      if (!this.form.businessLicenseFileId) {
        common_vendor.index.showToast({ title: "请上传营业执照照片", icon: "none" });
        return false;
      }
      if (!this.companyType) {
        common_vendor.index.showToast({ title: "请选择运输公司类型", icon: "none" });
        return false;
      }
      if (this.form.verificationMethod === "LEGAL_REPRESENTATIVE") {
        if (!this.form.legalIdNumber.trim() || this.form.legalIdNumber.trim().length !== 18) {
          common_vendor.index.showToast({ title: "请输入正确的法人身份证号", icon: "none" });
          return false;
        }
        if (!this.form.legalIdFrontFileId || !this.form.legalIdBackFileId) {
          common_vendor.index.showToast({ title: "请上传法人身份证正反面照片", icon: "none" });
          return false;
        }
      } else {
        if (!this.form.agentName.trim()) {
          common_vendor.index.showToast({ title: "请输入委托经办人姓名", icon: "none" });
          return false;
        }
        if (!this.form.agentIdNumber.trim() || this.form.agentIdNumber.trim().length !== 18) {
          common_vendor.index.showToast({ title: "请输入正确的经办人身份证号", icon: "none" });
          return false;
        }
        if (!this.form.agentIdFrontFileId || !this.form.agentIdBackFileId || !this.form.authorizationLetterFileId) {
          common_vendor.index.showToast({ title: "请上传经办人正反面身份证和授权书", icon: "none" });
          return false;
        }
      }
      const office = this.form.office;
      if (!office.provinceId || !office.cityId) {
        common_vendor.index.showToast({ title: "请选择办公经营省市", icon: "none" });
        return false;
      }
      if (!office.poiName.trim()) {
        common_vendor.index.showToast({ title: "请选择办公经营地址名称", icon: "none" });
        return false;
      }
      if (!office.address.trim()) {
        common_vendor.index.showToast({ title: "请选择办公经营详细地址", icon: "none" });
        return false;
      }
      if (!office.locationLng || !office.locationLat) {
        common_vendor.index.showToast({ title: "请在地图上确认办公经营位置", icon: "none" });
        return false;
      }
      if (this.form.serviceCapabilities.includes("LARGE_TRUCK")) {
        const license = this.form.largeTruckLicense;
        if (!license.ownerName.trim()) {
          common_vendor.index.showToast({ title: "请输入大板许可证业户名称", icon: "none" });
          return false;
        }
        if (!license.licenseNo.trim()) {
          common_vendor.index.showToast({ title: "请输入大板许可证字号", icon: "none" });
          return false;
        }
        if (!license.startDate || !license.endDate) {
          common_vendor.index.showToast({ title: "请选择许可证有效期起止时间", icon: "none" });
          return false;
        }
        if (!license.licenseFileId) {
          common_vendor.index.showToast({ title: "请上传许可证照片", icon: "none" });
          return false;
        }
        if (!this.siteFiles.length) {
          common_vendor.index.showToast({ title: "请至少上传一张办公/场地照片", icon: "none" });
          return false;
        }
      }
      return true;
    },
    async submit() {
      if (!this.validate())
        return;
      const proceed = () => {
        this.doSubmit();
      };
      if (this.removedCapabilitiesWarning) {
        common_vendor.index.showModal({
          title: "公司类型变更提示",
          content: "由于您修改公司类型后减少了原有服务能力，资质通过后，不再支持的相关线路将被系统自动关闭，是否确认提交？",
          success(res) {
            if (res.confirm)
              proceed();
          }
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
          verificationMethod: this.form.verificationMethod
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
        if (this.form.verificationMethod === "LEGAL_REPRESENTATIVE") {
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
        if (this.form.serviceCapabilities.includes("LARGE_TRUCK")) {
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
            licenseValidTo: license.endDate
          };
          payload.operationSiteFileIds = this.siteFiles.map((f) => f.fileId);
        }
        await common_vendor.api.submitVerification(payload);
        common_vendor.index.showToast({ title: "资质认证提交成功", icon: "success" });
        setTimeout(() => {
          common_vendor.index.redirectTo({ url: "/pages/verification/status" });
        }, 800);
      } finally {
        this.submitting = false;
      }
    }
  }
};
if (!Array) {
  const _easycom_carrier_image_uploader2 = common_vendor.resolveComponent("carrier-image-uploader");
  const _easycom_region_select_field2 = common_vendor.resolveComponent("region-select-field");
  const _easycom_address_map_picker2 = common_vendor.resolveComponent("address-map-picker");
  (_easycom_carrier_image_uploader2 + _easycom_region_select_field2 + _easycom_address_map_picker2)();
}
const _easycom_carrier_image_uploader = () => "../../components/carrier-image-uploader/carrier-image-uploader.js";
const _easycom_region_select_field = () => "../../components/region-select-field/region-select-field.js";
const _easycom_address_map_picker = () => "../../components/address-map-picker/address-map-picker.js";
if (!Math) {
  (_easycom_carrier_image_uploader + _easycom_region_select_field + _easycom_address_map_picker)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_assets._imports_0$1,
    b: $options.companyType === "CAR_CARRIER" ? "/static/bottom_right_choose_selected.svg" : "/static/bottom_right_choose.svg",
    c: $options.companyType === "CAR_CARRIER" ? 1 : "",
    d: common_vendor.o(($event) => $options.setCompanyType("CAR_CARRIER"), "ff"),
    e: common_assets._imports_1$2,
    f: $options.companyType === "ROADSIDE_RESCUE" ? "/static/bottom_right_choose_selected.svg" : "/static/bottom_right_choose.svg",
    g: $options.companyType === "ROADSIDE_RESCUE" ? 1 : "",
    h: common_vendor.o(($event) => $options.setCompanyType("ROADSIDE_RESCUE"), "0a"),
    i: $options.removedCapabilitiesWarning
  }, $options.removedCapabilitiesWarning ? {} : {}, {
    j: common_vendor.o(($event) => $options.setSingleFile("businessLicenseFileId", $event), "15"),
    k: common_vendor.p({
      ["model-value"]: $options.singleFile("businessLicenseFileId"),
      title: "营业执照照片",
      ["usage-scene"]: "BUSINESS_LICENSE",
      ["add-text"]: "上传营业执照",
      single: true,
      compact: true,
      required: true,
      ["show-status"]: false,
      ["example-src"]: $data.exampleImages.carrierBusinessLicense
    }),
    l: $data.identityErrors.companyName ? 1 : "",
    m: common_vendor.o([($event) => $data.form.companyName = $event.detail.value, ($event) => $options.clearIdentityError("companyName")], "bd"),
    n: common_vendor.o((...args) => $options.checkCompanyNameUsed && $options.checkCompanyNameUsed(...args), "77"),
    o: common_vendor.o((...args) => $options.checkCompanyNameUsed && $options.checkCompanyNameUsed(...args), "29"),
    p: $data.form.companyName,
    q: $data.identityErrors.companyName
  }, $data.identityErrors.companyName ? {
    r: common_vendor.t($data.identityErrors.companyName)
  } : {}, {
    s: $data.identityErrors.creditCode ? 1 : "",
    t: common_vendor.o([($event) => $data.form.creditCode = $event.detail.value, ($event) => $options.clearIdentityError("creditCode")], "c3"),
    v: common_vendor.o((...args) => $options.checkCreditCodeUsed && $options.checkCreditCodeUsed(...args), "26"),
    w: common_vendor.o((...args) => $options.checkCreditCodeUsed && $options.checkCreditCodeUsed(...args), "df"),
    x: $data.form.creditCode,
    y: $data.identityErrors.creditCode
  }, $data.identityErrors.creditCode ? {
    z: common_vendor.t($data.identityErrors.creditCode)
  } : {}, {
    A: $data.form.legalRepresentativeName,
    B: common_vendor.o(($event) => $data.form.legalRepresentativeName = $event.detail.value, "f9"),
    C: common_vendor.o($options.onOfficeRegionSelect, "1b"),
    D: common_vendor.p({
      label: "所在省市",
      required: true,
      title: "选择办公经营省市",
      placeholder: "点击选择所在省份与城市",
      ["province-name"]: $data.form.office.provinceName,
      ["city-name"]: $data.form.office.cityName
    }),
    E: $data.form.office.poiName || $data.form.office.address
  }, $data.form.office.poiName || $data.form.office.address ? common_vendor.e({
    F: common_vendor.t($data.form.office.poiName || $data.form.office.address),
    G: $data.form.office.address
  }, $data.form.office.address ? {
    H: common_vendor.t($data.form.office.address)
  } : {}) : {}, {
    I: !$data.form.office.cityId ? 1 : "",
    J: common_vendor.o((...args) => $options.openAddressPicker && $options.openAddressPicker(...args), "b8"),
    K: common_vendor.t($data.form.verificationMethod === "LEGAL_REPRESENTATIVE" ? "●" : ""),
    L: $data.form.verificationMethod === "LEGAL_REPRESENTATIVE" ? 1 : "",
    M: common_vendor.o(($event) => $options.setVerificationMethod("LEGAL_REPRESENTATIVE"), "ad"),
    N: common_vendor.t($data.form.verificationMethod === "AUTHORIZED_AGENT" ? "●" : ""),
    O: $data.form.verificationMethod === "AUTHORIZED_AGENT" ? 1 : "",
    P: common_vendor.o(($event) => $options.setVerificationMethod("AUTHORIZED_AGENT"), "0f"),
    Q: $data.form.verificationMethod === "LEGAL_REPRESENTATIVE"
  }, $data.form.verificationMethod === "LEGAL_REPRESENTATIVE" ? {
    R: common_vendor.o(($event) => $options.setSingleFile("legalIdFrontFileId", $event), "0e"),
    S: common_vendor.p({
      ["model-value"]: $options.singleFile("legalIdFrontFileId"),
      title: "身份证人像面",
      ["usage-scene"]: "IDENTITY_CARD",
      ["add-text"]: "上传人像面",
      single: true,
      required: true,
      ["show-status"]: false,
      ["example-src"]: $data.exampleImages.carrierIdentityCard
    }),
    T: common_vendor.o(($event) => $options.setSingleFile("legalIdBackFileId", $event), "d7"),
    U: common_vendor.p({
      ["model-value"]: $options.singleFile("legalIdBackFileId"),
      title: "身份证国徽面",
      ["usage-scene"]: "IDENTITY_CARD",
      ["add-text"]: "上传国徽面",
      single: true,
      required: true,
      ["show-status"]: false,
      ["example-src"]: $data.exampleImages.carrierIdentityCard
    }),
    V: $data.form.legalRepresentativeName,
    W: $data.form.legalIdNumber,
    X: common_vendor.o(($event) => $data.form.legalIdNumber = $event.detail.value, "aa")
  } : {
    Y: common_vendor.o(($event) => $options.setSingleFile("agentIdFrontFileId", $event), "32"),
    Z: common_vendor.p({
      ["model-value"]: $options.singleFile("agentIdFrontFileId"),
      title: "经办人身份证正面",
      ["usage-scene"]: "IDENTITY_CARD",
      ["add-text"]: "上传正面",
      single: true,
      required: true,
      ["show-status"]: false,
      ["example-src"]: $data.exampleImages.carrierIdentityCard
    }),
    aa: common_vendor.o(($event) => $options.setSingleFile("agentIdBackFileId", $event), "e4"),
    ab: common_vendor.p({
      ["model-value"]: $options.singleFile("agentIdBackFileId"),
      title: "经办人身份证反面",
      ["usage-scene"]: "IDENTITY_CARD",
      ["add-text"]: "上传反面",
      single: true,
      required: true,
      ["show-status"]: false,
      ["example-src"]: $data.exampleImages.carrierIdentityCard
    }),
    ac: $data.form.agentName,
    ad: common_vendor.o(($event) => $data.form.agentName = $event.detail.value, "4c"),
    ae: $data.form.agentIdNumber,
    af: common_vendor.o(($event) => $data.form.agentIdNumber = $event.detail.value, "ef"),
    ag: common_vendor.o(($event) => $options.setSingleFile("authorizationLetterFileId", $event), "ea"),
    ah: common_vendor.p({
      ["model-value"]: $options.singleFile("authorizationLetterFileId"),
      title: "授权委托书 (加盖公章)",
      ["usage-scene"]: "AUTHORIZATION_LETTER",
      ["add-text"]: "上传委托书",
      single: true,
      required: true,
      ["show-status"]: false,
      ["example-src"]: $data.exampleImages.carrierAuthorizationLetter
    })
  }, {
    ai: $data.form.serviceCapabilities.includes("LARGE_TRUCK")
  }, $data.form.serviceCapabilities.includes("LARGE_TRUCK") ? {
    aj: common_vendor.o($options.setLargeTruckLicenseFile, "0d"),
    ak: common_vendor.p({
      ["model-value"]: $options.largeTruckLicenseFile,
      title: "道路运输许可证照片",
      ["usage-scene"]: "ROAD_LICENSE",
      ["add-text"]: "上传许可证",
      single: true,
      compact: true,
      required: true,
      ["show-status"]: false,
      ["example-src"]: $data.exampleImages.carrierRoadLicense
    }),
    al: $data.form.largeTruckLicense.ownerName,
    am: common_vendor.o(($event) => $data.form.largeTruckLicense.ownerName = $event.detail.value, "b8"),
    an: $data.form.largeTruckLicense.licenseNo,
    ao: common_vendor.o(($event) => $data.form.largeTruckLicense.licenseNo = $event.detail.value, "1d"),
    ap: common_vendor.t($data.form.largeTruckLicense.startDate || "选择开始日期"),
    aq: common_vendor.o(($event) => $options.onDateChange($event, "startDate"), "f6"),
    ar: common_vendor.t($data.form.largeTruckLicense.endDate || "选择结束日期"),
    as: common_vendor.o(($event) => $options.onDateChange($event, "endDate"), "90")
  } : {}, {
    at: $data.form.serviceCapabilities.includes("LARGE_TRUCK")
  }, $data.form.serviceCapabilities.includes("LARGE_TRUCK") ? {
    av: common_vendor.o(($event) => $data.siteFiles = $event, "31"),
    aw: common_vendor.p({
      title: "办公/场地经营照片",
      tip: "请上传1至9张经营场所实景照片",
      ["usage-scene"]: "OPERATION_SITE",
      ["max-count"]: 9,
      ["add-text"]: "上传场所照",
      required: true,
      compact: true,
      ["example-src"]: $data.exampleImages.carrierOperationSite,
      modelValue: $data.siteFiles
    })
  } : {}, {
    ax: common_vendor.sr("addressMapPicker", "730b48e0-9"),
    ay: common_vendor.o($options.confirmAddressPicker, "da"),
    az: common_vendor.p({
      title: "选择详细地址"
    }),
    aA: $data.submitting,
    aB: common_vendor.o((...args) => $options.submit && $options.submit(...args), "e1")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
