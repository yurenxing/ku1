const WXAPI = require('apifm-wxapi')
const app = getApp();
const CONFIG = require('../../config.js')
const AUTH = require('../../utils/auth')
const SelectSizePrefix = "选择："
import Poster from 'wxa-plugin-canvas/poster/poster'

Page({
  data: {
    wxlogin: true,

    videosDetail: {},
    hasMoreSelect: false,
    selectSize: SelectSizePrefix,

    videoId: '',
    videos: [],
    categoryId: ''
  },
  async onLoad(e) {
    // e.id = 235853
    if (e && e.scene) {
      const scene = decodeURIComponent(e.scene) // 处理扫码进商品详情页面的逻辑
      if (scene && scene.split(',').length >= 2) {
        e.id = scene.split(',')[0]
        wx.setStorageSync('referrer', scene.split(',')[1])
      }
    }
    this.data.videoId = e.id
    this.setData({
      videoId: e.id
    })

    this.logViewDetails(e.id)

  },

  logViewDetails: function(goodsId) {
    var that = this;
    var loginToken = wx.getStorageSync('token') // 用户登录 token
    var remark = this.data.remark; // 备注信息

    var goodsJsonStr = '[{"goodsId":' + goodsId + ',"number":1,"propertyChildIds":"","logisticsType":0, "inviter_id":0}]'

    let postData = {
      token: loginToken,
      goodsJsonStr: goodsJsonStr,
      remark: "",
      isNeedLogistics: 0,
      peisongType: 'zq'
    };
    WXAPI.orderCreate(postData).then(function (res) {
      if (res.code != 0) {
        wx.showModal({
          title: '错误',
          content: res.msg,
          showCancel: false
        })
        return;
      }
    })
  },

  onShow (){
    AUTH.checkHasLogined().then(isLogined => {
      if (isLogined) {
        this.setData({
          wxlogin: isLogined
        })
        this.goodsFavCheck()
      }
    })
    this.getVideosDetail(this.data.videoId)
    console.log("videoId="+this.data.videoId)
  },

  async goodsFavCheck() {
    WXAPI.goodsFavList({
      token: wx.getStorageSync('token')
    })
    const res = await WXAPI.goodsFavCheck(wx.getStorageSync('token'), this.data.videoId)
    if (res.code == 0) {
      this.setData({
        faved: true
      })
    } else {
      this.setData({
        faved: false
      })
    }
  },
  async addFav(){
    AUTH.checkHasLogined().then(isLogined => {
      this.setData({
        wxlogin: isLogined
      })
      if (isLogined) {
        if (this.data.faved) {
          // 取消收藏
          WXAPI.goodsFavDelete(wx.getStorageSync('token'), '', this.data.videoId).then(res => {
            this.goodsFavCheck()
          })
        } else {
          // 加入收藏
          WXAPI.goodsFavPut(wx.getStorageSync('token'), this.data.videoId).then(res => {
            this.goodsFavCheck()
          })
        }
      }
    })
  },
  async getVideosDetail(videoId) {
    const that = this;
    const videosDetailRes = await WXAPI.goodsDetail(videoId)
    if (videosDetailRes.code == 0) {
      var selectSizeTemp = SelectSizePrefix;
      if (videosDetailRes.data.basicInfo.shopId) {
        this.shopSubdetail(videosDetailRes.data.basicInfo.shopId)
      }
      that.data.videosDetail = videosDetailRes.data;
      if (videosDetailRes.data.basicInfo.videoId) {
        that.getVideoSrc(videosDetailRes.data.basicInfo.videoId);
      }
      let _data = {
        videosDetail: videosDetailRes.data,
      }

      that.setData(_data);

    }
    that.getRelatedVideoList();
  },

  async getRelatedVideoList() {
    wx.showLoading({
      title: '加载中',
    })

    const categoryId = this.data.videosDetail.basicInfo.categoryId
    const videoId = this.data.videosDetail.basicInfo.id
    console.log("categoryId " + categoryId)

    const res = await WXAPI.goods({
      recommendStatus : 1,
      categoryId: categoryId,
      page: 1,
      pageSize: 6
    })
    wx.hideLoading()
    if (res.code == 700) {
      this.setData({
        videos: null
      });
      return
    }
    if(res.code == 0) {
      for(var i=0; i<res.data.length; i++) {
          if(res.data[i].tags) {
          const _tags = res.data[i].tags.split(",")
          res.data[i].tagList = []
          _tags.forEach(tag=>{
            res.data[i].tagList.push(tag)
          })
        }
        if(res.data[i].videoId) {
          await WXAPI.videoDetail(res.data[i].videoId).then(function(response) {
            if(response.code == 0) {
              res.data[i].video = response.data
            }
          })
        }
        if(res.data[i].shopId) {
          await WXAPI.shopSubdetail(res.data[i].shopId).then(function(response) {
            if(response.code == 0) {
              res.data[i].company = response.data.info
            }
          })
        }
      }
      const _data = res.data.filter(ele=> {
        return ele.id != videoId
      })
      this.setData({
        videos: _data
      })
    }
  },


  async shopSubdetail(shopId){
    const res = await WXAPI.shopSubdetail(shopId)
    if (res.code == 0) {
      this.setData({
        shopSubdetail: res.data
      })
    }
  },

  toShopDetailTap: function(e) {
    wx.navigateTo({
      url: "/pages/shop-details/index?id=" + e.currentTarget.dataset.id
    })
  },
  toShopVideosTap : function(e) {
    wx.navigateTo({
      url: "/pages/video-list/index?shopId=" + e.currentTarget.dataset.id
    })
  },

  toVideoDetailTap: function(e) {
    let videoId = e.currentTarget.dataset.id
    this.getVideosDetail(videoId)

    // wx.navigateTo({
    //   url: "/pages/video-detail/index?id=" + e.currentTarget.dataset.id
    // })
  },

  getVideoSrc: function(videoId) {
    var that = this;
    WXAPI.videoDetail(videoId).then(function(res) {
      if (res.code == 0) {
        that.setData({
          videoMp4Src: res.data.fdMp4
        });
      }
    })
  },

  goIndex() {
    wx.switchTab({
      url: '/pages/index/index',
    });
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
  },
  previewImage(e){
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      current: url, // 当前显示图片的http链接
      urls: [url] // 需要预览的图片http链接列表
    })
  },
  async drawSharePic() {
    const _this = this
    const qrcodeRes = await WXAPI.wxaQrcode({
      scene: _this.data.videosDetail.basicInfo.id + ',' + wx.getStorageSync('uid'),
      page: 'pages/goods-details/index',
      is_hyaline: true,
      autoColor: true,
      expireHours: 1
    })
    if (qrcodeRes.code != 0) {
      wx.showToast({
        title: qrcodeRes.msg,
        icon: 'none'
      })
      return
    }
    const qrcode = qrcodeRes.data
    const pic = _this.data.videosDetail.basicInfo.pic
    wx.getImageInfo({
      src: pic,
      success(res) {
        const height = 490 * res.height / res.width
        _this.drawSharePicDone(height, qrcode)
      },
      fail(e) {
        console.error(e)
      }
    })
  },
  drawSharePicDone(picHeight, qrcode) {
    const _this = this
    const _baseHeight = 74 + (picHeight + 120)
    this.setData({
      posterConfig: {
        width: 750,
        height: picHeight + 660,
        backgroundColor: '#fff',
        debug: false,
        blocks: [
          {
            x: 76,
            y: 74,
            width: 604,
            height: picHeight + 120,
            borderWidth: 2,
            borderColor: '#c2aa85',
            borderRadius: 8
          }
        ],
        images: [
          {
            x: 133,
            y: 133,
            url: _this.data.videosDetail.basicInfo.pic, // 商品图片
            width: 490,
            height: picHeight
          },
          {
            x: 76,
            y: _baseHeight + 199,
            url: qrcode, // 二维码
            width: 222,
            height: 222
          }
        ],
        texts: [
          {
            x: 375,
            y: _baseHeight + 80,
            width: 650,
            lineNum:2,
            text: _this.data.videosDetail.basicInfo.name,
            textAlign: 'center',
            fontSize: 40,
            color: '#333'
          },
          {
            x: 375,
            y: _baseHeight + 180,
            text: '￥' + _this.data.videosDetail.basicInfo.minPrice,
            textAlign: 'center',
            fontSize: 50,
            color: '#e64340'
          },
          {
            x: 352,
            y: _baseHeight + 320,
            text: '长按识别小程序码',
            fontSize: 28,
            color: '#999'
          }
        ],
      }
    }, () => {
      Poster.create();
    });
  },
  onPosterSuccess(e) {
    console.log('success:', e)
    this.setData({
      posterImg: e.detail,
      showposterImg: true
    })
  },
  onPosterFail(e) {
    console.error('fail:', e)
  },
  savePosterPic() {
    const _this = this
    wx.saveImageToPhotosAlbum({
      filePath: this.data.posterImg,
      success: (res) => {
        wx.showModal({
          content: '已保存到手机相册',
          showCancel: false,
          confirmText: '知道了',
          confirmColor: '#333'
        })
      },
      complete: () => {
        _this.setData({
          showposterImg: false
        })
      },
      fail: (res) => {
        wx.showToast({
          title: res.errMsg,
          icon: 'none',
          duration: 2000
        })
      }
    })
  },
  async goodsFavCheck() {
    WXAPI.goodsFavList({
      token: wx.getStorageSync('token')
    })
    const res = await WXAPI.goodsFavCheck(wx.getStorageSync('token'), this.data.videoId)
    if (res.code == 0) {
      this.setData({
        faved: true
      })
    } else {
      this.setData({
        faved: false
      })
    }
  },
  async addFav(){
    AUTH.checkHasLogined().then(isLogined => {
      this.setData({
        wxlogin: isLogined
      })
      if (isLogined) {
        if (this.data.faved) {
          // 取消收藏
          WXAPI.goodsFavDelete(wx.getStorageSync('token'), '', this.data.videoId).then(res => {
            this.goodsFavCheck()
          })
        } else {
          // 加入收藏
          WXAPI.goodsFavPut(wx.getStorageSync('token'), this.data.videoId).then(res => {
            this.goodsFavCheck()
          })
        }
      }
    })
  },
})
