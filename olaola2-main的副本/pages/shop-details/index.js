const WXAPI = require('apifm-wxapi')
const app = getApp();
const CONFIG = require('../../config.js')
const AUTH = require('../../utils/auth')
const SelectSizePrefix = "选择："
import Poster from 'wxa-plugin-canvas/poster/poster'

let videoAd = null; // 视频激励广告

Page({
  data: {
    wxlogin: true,
    shopDetail: {},
  },
  async onLoad(e) {
    if (e && e.scene) {
      const scene = decodeURIComponent(e.scene) // 处理扫码进商品详情页面的逻辑
      if (scene && scene.split(',').length >= 2) {
        e.id = scene.split(',')[0]
        wx.setStorageSync('referrer', scene.split(',')[1])
      }
    }
    const that = this
    that.getShopDetail(e.id)
  },

  onShow (){

  },



  async getShopDetail(shopId) {
    console.log("shopId=" + shopId)
    const that = this
    const res = await WXAPI.shopSubdetail(shopId)
    if(res.code == 0) {
      that.setData({
        shopDetail: res.data
      })
    }
  },


  /**
   * 规格选择弹出框隐藏
   */
  closePopupTap: function() {
    this.setData({
      hideShopPopup: true
    })
  },


  cancelLogin() {
    this.setData({
      wxlogin: true
    })
  },
  processLogin(e) {
    if (!e.detail.userInfo) {
      wx.showToast({
        title: '已取消',
        icon: 'none',
      })
      return;
    }
    AUTH.register(this);
  },
  closePop(){
    this.setData({
      posterShow: false
    })
  }
})
