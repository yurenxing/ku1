const app = getApp()
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
    wxlogin: true,

    categories: [],
    categorySelected: {
      name: '',
      id: '',
      recommendStatus: 0
    },
    videoCategories: [],
    activeCategoryId: 0,

    videos: [],

    onLoadStatus: true,
    curPage: 1,
    pageSize: 8,
    scrolltop: 0,
    loadingMore: true,

    currentVid: null,
    currentVideo: null,
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.getVideoCategories();
  },

  getUserApiInfo: function () {
    var that = this;
    WXAPI.userDetail(wx.getStorageSync('token')).then(function (res) {
      if (res.code == 0) {
        let _data = {}
        _data.apiUserInfoMap = res.data
        if (res.data.base.mobile) {
          _data.userMobile = res.data.base.mobile
        }
        that.setData(_data);
      }
    })
  },

  async getVideoCategories() {
    wx.showLoading({
      title: '加载中',
    })
    const res = await WXAPI.goodsCategory()

    let categories = [];
    let categoryName = '';
    let categoryId = '';
    let recommendStatus = 0;
    let recommends ={name: '推荐', id: CONFIG.videoCategoryId, level: 2, recommendStatus: 1}
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
      activeCategoryId: categoryId,
      curPage: 1,
      categorySelected: {
        name: categoryName,
        id: categoryId,
        recommendStatus: recommendStatus
      }
    });

    wx.hideLoading()

    this.getVideoList(false);
  },
  onReachBottom: function() {
    console.log("onReachBottom");

    this.setData({
      curPage: this.data.curPage + 1
    });
    this.getVideoList(true)

  },

  onPullDownRefresh: function() {
    console.log("onPullDownRefresh")
    
    this.setData({
      curPage: 1
    });
    this.getVideoList()
    wx.stopPullDownRefresh()
  },

  async getVideoList(append) {
    this.setData({
      loadingMore : true,
      onLoadStatus : true
    })
    wx.showLoading({
      title: '加载中',
    })
    var res;
    if(this.data.categorySelected.recommendStatus == 1) {
      res = await WXAPI.goods({
        recommendStatus : 1,
        categoryId: this.data.categorySelected.id,
        page: this.data.curPage,
        pageSize: this.data.pageSize
      })
    }
    else {
      res = await WXAPI.goods({
        categoryId: this.data.categorySelected.id,
        page: this.data.curPage,
        pageSize: this.data.pageSize
      })
    }


    if (res.code == 404 || res.code == 700) {
      let newData = {
        loadingMore: false,
        onLoadStatus : false
      }
      if(!append) {
        newData.videos = []
      }
      this.setData(newData);
      wx.hideLoading()
      return
    }
    let videos = []
    if(append) {
      videos = this.data.videos;
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
          await WXAPI.goodsFavCheck(wx.getStorageSync('token'), res.data[i].id).then(function(response) {
            if(response.code == 0) {
              res.data[i].faved = true
            }else {
              res.data[i].faved = false
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

        videos.push(res.data[i])

      }
      this.setData({
        loadingMore: false,
        onLoadStatus : false,
        videos: videos,
      })
    }
    this.setData({
      onLoadStatus : false
    })
    wx.hideLoading()
  },


  onCategoryClick: function(e) {
    var that = this;
    var id = e.target.dataset.id;
    if (id === that.data.categorySelected.id || that.data.onLoadStatus === true) {
      console.log("same button")
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
        scrolltop: 0,
        curPage: 1,

      });
      that.getVideoList();
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
      url: '/pages/video-list/index?name=' + this.data.inputVal,
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
      console.log("login="+ isLogined)

      this.setData({
        wxlogin: isLogined
      })
      if(isLogined) {
        this.getUserApiInfo();
        //TOOLS.showTabBarBadge() // 获取购物车数据，显示TabBarBadge
      }
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



  getVideoId(id) {
    const that = this;
    for(var i=0; i<that.data.videos.length; i++) {
      let item = that.data.videos[i]
      if(item.id == id) {
        return that.data.videos[i].videoId
      }
    }
  },

  async increaseViews(goodsId) {
      const videosDetailRes = await WXAPI.goodsDetail(goodsId)
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

  playVideo(event) {
    // let videoId = this.getVideoId(event.target.dataset.vid)

    let videoId = event.target.dataset.vid
    this.increaseViews(videoId)
    console.log("views increase(videoId) =" + videoId)
    this.logViewDetails(videoId)
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
    wx.navigateTo({
      url: "/pages/video-details/index?id=" + e.currentTarget.dataset.id
    })
  },

  tapScanQR: function(e) {
    console.log("scanQR" + e)
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

  getFaved(id) {
    var that = this
    for(var i=0; i<that.data.videos.length; i++) {
      let item = that.data.videos[i]
      if(item.id == id) {
        return that.data.videos[i].faved
      }
    }
  },

  async videoFavCheck(id) {
    var that = this
    WXAPI.goodsFavList({
      token: wx.getStorageSync('token')
    })
    const res = await WXAPI.goodsFavCheck(wx.getStorageSync('token'), id)

    for(var i=0; i<that.data.videos.length; i++) {
      let item = that.data.videos[i]
      if(item.id == id) {
        if(res.code == 0) {
          console.log("true")
          that.data.videos[i].faved = true
        }
        else {
          console.log("false")
          that.data.videos[i].faved = false
        }
      }
      console.log("i=" + id)

    }
    this.setData({
      videos: that.data.videos
    })
  },

  async addFav(e){
    var id = e.currentTarget.dataset.id
    console.log("id="+id)
    AUTH.checkHasLogined().then(isLogined => {
      this.setData({
        wxlogin: isLogined
      })
      if (isLogined) {
        let faved = this.getFaved(id)
        if (faved) {
          // 取消收藏
          WXAPI.goodsFavDelete(wx.getStorageSync('token'), '', id).then(res => {
            this.videoFavCheck(id)
          })
        } else {
          // 加入收藏
          WXAPI.goodsFavPut(wx.getStorageSync('token'), id).then(res => {
            this.videoFavCheck(id)
          })
        }
      }
    })
  },

})
