const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    listType: 2, // 1为1个商品一行，2为2个商品一行
    name: '', // 搜索关键词
    orderBy: '', // 排序规则
    videos: [],
    currentVid: null,
    currentVideo: null,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      name: options.name,
      categoryId: options.categoryId,
      shopId: options.shopId
    })
    this.search(false)
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  onReachBottom : function() {
    console.log("onReachBottom");
    this.setData({
      curPage: this.data.curPage + 1
    })
    this.search(true)
  },
  async search(append){
    // 搜索商品
    wx.showLoading({
      title: '加载中',
    })
    const _data = {
      orderBy: this.data.orderBy,
      page: 1,
      pageSize: 999,
    }
    if (this.data.name) {
      _data.nameLike= this.data.name
    }
    if (this.data.categoryId) {
      _data.categoryId = this.data.categoryId
    }
    if(this.data.shopId) {
      _data.shopId = this.data.shopId
    }
    let videos = []
    if(append) {
      videos = this.data.videos;
    }
    const res = await WXAPI.goods(_data)
    wx.hideLoading()
    if (res.code == 0) {
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
        loadingMoreHidden: true,
        videos: videos
      })
    } else {
      this.setData({
        videos: null,
      })
    }
  },

  toVideoDetailTap: function(e) {
    wx.navigateTo({
      url: "/pages/video-details/index?id=" + e.currentTarget.dataset.id
    })
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
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },
  changeShowType(){
    if (this.data.listType == 1) {
      this.setData({
        listType: 2
      })
    } else {
      this.setData({
        listType: 1
      })
    }
  },
  bindinput(e){
    this.setData({
      name: e.detail.value
    })
  },
  bindconfirm(e){
    this.setData({
      name: e.detail.value
    })
    this.search()
  },
  filter(e){
    this.setData({
      orderBy: e.currentTarget.dataset.val
    })
    this.search()
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
