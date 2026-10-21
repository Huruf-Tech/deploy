type TBrand = { brand: string; version: string };

export type TDeviceInfo = {
  mobile: boolean;
  brands: TBrand[];
  model: string;
  platform: string;
  platformVersion: string;
};
