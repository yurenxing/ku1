const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const TOOLS = require('../../utils/tools.js') // TOOLS.showTabBarBadge();
const CONFIG = require('../../config.js')
const DATE = require('../../utils/date.js')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    categories: [],
    categorySelected: {
      name: '',
      id: '',
      recommendStatus: 0
    },
    videoCategories: [],

    recommendVideos: [],
    currentVideos: [],

    onLoadStatus: true,
    scrolltop: 0,

    skuCurGoods: undefined,
    currentVid: null,
    currentVideo: null,
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    wx.showShareMenu({
      withShareTicket: true
    })

    this.getVideoCategories();
  },


  async getVideoCategories() {
    wx.showLoading({
      title: '加载中',
    })
    const res = await WXAPI.goodsCategory()
    wx.hideLoading()
    let categories = [];
    let categoryName = '';
    let categoryId = '';
    let recommendStatus = 0;
    let recommends ={name: '精选', id: CONFIG.articleCategoryId, level: 2, recommendStatus: 1}
    categories.push(recommends)

    categoryName = recommends.name
    categoryId = recommends.id
    recommendStatus = recommends.recommendStatus

    if (res.code == 0) {
      for (let i = 0; i < res.data.length; i++) {
        let item = res.data[i];
        categories.push(item);
      }
    }
    this.setData({
      categories: categories,
      categorySelected: {
        name: categoryName,
        id: categoryId,
        recommendStatus: recommendStatus
      }
    });
    this.getVideosList();
  },


  async getVideosList() {
    wx.showLoading({
      title: '加载中',
    })
    var res;
    if(this.data.categorySelected.recommendStatus == 1) {
      res = await WXAPI.goods({
        recommendStatus : 1,
        categoryId: this.data.categorySelected.id,
        page: 1,
        pageSize: 10000
      })
    }
    else {
      res = await WXAPI.goods({
        categoryId: this.data.categorySelected.id,
        page: 1,
        pageSize: 100000
      })
    }
    wx.hideLoading()
    if (res.code == 700) {
      this.setData({
        currentVideos: null
      });
      return
    }
    if(res.code == 0) {
      for(var i=0; i<res.data.length; i++) {
        // res.data[i].dateUpdate = res.data[i].dateUpdate.substring(10)
        // res.data[i].dateUpdate = DATE.timeago(new Date(res.data[i].dateUpdate).getTime(), 'Y-M-D h:m:s')
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
      this.setData({
        loadingMoreHidden: true,
        currentVideos: res.data
      })
    }
  },

  toDetailsTap: function(e) {
    wx.navigateTo({
      url: "/pages/videos-details/index?id=" + e.currentTarget.dataset.id
    })
  },

  onCategoryClick: function(e) {
    var that = this;
    var id = e.target.dataset.id;
    if (id === that.data.categorySelected.id) {
      that.setData({
        scrolltop: 0,
      })
    } else {
      var categoryName = '';
      var recommendStatus = 0;
      for (var i = 0; i < that.data.categories.length; i++) {
        let item = that.data.categories[i];
        if (item.id == id) {
          categoryName = item.name;
          if(i == 0) {
            recommendStatus = 1;
          }else {
            recommendStatus = 0;
          }
          break;
        }
      }
      that.setData({
        categorySelected: {
          name: categoryName,
          id: id,
          recommendStatus: recommendStatus
        },
        scrolltop: 0
      });
      that.getVideosList();
    }
  },
  bindinput(e) {
    this.setData({
      inputVal: e.detail.value
    })
  },
  bindconfirm(e) {
    this.setData({
      inputVal: e.detail.value
    })
    wx.navigateTo({
      url: '/pages/goods/list?name=' + this.data.inputVal,
    })
  },
  onShareAppMessage() {
    return {
      title: '"' + wx.getStorageSync('mallName') + '" ' + wx.getStorageSync('share_profile'),
      path: '/pages/index/index?inviter_id=' + wx.getStorageSync('uid')
    }
  },
  onShow() {
    AUTH.checkHasLogined().then(isLogined => {
      if (isLogined) {
        this.setData({
          wxlogin: isLogined
        })
        TOOLS.showTabBarBadge() // 获取购物车数据，显示TabBarBadge
      }
    })
    const _categoryId = wx.getStorageSync('_categoryId')
    wx.removeStorageSync('_categoryId')
    if (_categoryId) {
      this.data.categorySelected.id = _categoryId
      this.categories();
    } else {
      this.data.categorySelected.id = null
    }
  },

  playVideo(event) {
    if (this.data.currentVideo !== null) {
      this.data.currentVideo.stop()
    }

    const currentVideo = wx.createVideoContext(
      `${ event.target.dataset.vid }`)
    currentVideo.play()

    this.setData({
      currentVideo,
      currentVid: event.target.dataset.vid
    })
  },
  stopVideo(event) {
    console.log("stopVideo")
    console.log(event)
    if(this.data.currentVideo !== null) {
      this.data.currentVideo.stop()
    }
    this.setData({
      currentVideo: null,
      currentVid: null
    })
  },

  toDetailsTap: function(e) {
    wx.navigateTo({
      url: "/pages/videos-details/index?id=" + e.currentTarget.dataset.id
    })
  },

  tapScanQR: function(e) {
    console.log(e)
    wx.scanCode({
      onlyFromCamera: false,
      scanType: ['qrCode', 'barCode'],
      success: function(res) {
        console.log(res)
        wx.navigateTo({
          url: res.result
        })
      }
    })
  },
  async goodsFavCheck(goodsId) {
    WXAPI.goodsFavList({
      token: wx.getStorageSync('token')
    })
    const res = await WXAPI.goodsFavCheck(wx.getStorageSync('token'), this.goodsId)
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
  async addFav(e){
    var goodsId = e.currentTarget.dataset.id
    AUTH.checkHasLogined().then(isLogined => {
      this.setData({
        wxlogin: isLogined
      })
      if (isLogined) {
        if (this.data.faved) {
          // 取消收藏
          WXAPI.goodsFavDelete(wx.getStorageSync('token'), '', this.goodsId).then(res => {
            this.goodsFavCheck(this.goodsId)
          })
        } else {
          // 加入收藏
          WXAPI.goodsFavPut(wx.getStorageSync('token'), this.goodsId).then(res => {
            this.goodsFavCheck(this.goodsId)
          })
        }
      }
    })
  },

})
