<template>
  <view class="field">
    <text v-if="label" class="label">
      {{ label }}
      <text v-if="required" class="required">*</text>
    </text>
    <view class="picker-display region-select-display" :class="{ disabled }" @click="open">
      <text v-if="displayText">{{ displayText }}</text>
      <text v-else class="region-select-placeholder">{{ placeholder }}</text>
    </view>
    <region-picker ref="regionPicker" :title="title" @select="onSelect" />
  </view>
</template>

<script>
import RegionPicker from '../region-picker/region-picker.vue';

export default {
  name: 'RegionSelectField',
  components: {
    RegionPicker,
  },
  props: {
    label: {
      type: String,
      default: '',
    },
    required: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: '选择省市',
    },
    placeholder: {
      type: String,
      default: '选择省份与城市',
    },
    provinceName: {
      type: String,
      default: '',
    },
    cityName: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    displayText() {
      if (!this.provinceName || !this.cityName) return '';
      return `${this.provinceName} · ${this.cityName}`;
    },
  },
  methods: {
    open() {
      if (this.disabled) {
        this.$emit('disabled-click');
        return;
      }
      this.$refs.regionPicker.open();
    },
    onSelect(region) {
      this.$emit('select', region);
    },
  },
};
</script>

<style>
.required {
  color: #ef4444;
  margin-left: 6rpx;
  font-weight: bold;
}

.region-select-display.disabled {
  background: #f3f4f6;
  color: #9ca3af;
}

.region-select-placeholder {
  color: #9ca3af;
}
</style>
