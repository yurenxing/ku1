const WXAPI = require('apifm-wxapi')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    name: "",
    categoryId: "",
    page: 1, // 读取第几页数据，便于实现下滑分页
    articleList: [], // 文章列表
    tagList: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad (options) {
    //读取搜索关键字
    if(options.name) {
      this.setData({
        name: options.name,
        articleList: [],
      })
      this.search()
      return;
    }
    // 读取分类详情
    const categoryInfo = await WXAPI.cmsCategoryDetail(options.pid);
    if (categoryInfo.code != 0) {
      wx.showModal({
        title: '提示',
        content: '当前分类不存在',
        showCancel: false,
        confirmText: '返回',
        success(res) {
          wx.navigateBack()
        }
      })
      return;
    }

    // 设置小程序名称
    wx.setNavigationBarTitle({
      title: wx.getStorageSync('mallName')
    })
    this.setData({
      categoryInfo: categoryInfo.data
    });
    // 读取分类下的文章
    this.fetchArticles(options.pid);
  },

  async fetchArticles (pid) {
    const response = await WXAPI.cmsArticles({
      page: this.data.page,
      categoryId: pid
    });
    if (response.code == 0) {
      response.data.forEach(item => {
        if(item.tags) {
          const _tags = item.tags.split(",")
          item.tagList = [];
          _tags.forEach(tag=>{
            item.tagList.push(tag)
          })
          console.log(_tags)
          console.log(item.tagList)
        }
      })
      this.setData({
        articleList: this.data.articleList.concat(response.data)
      });

    }
  },

  async search() {
    this.searchByTitle()
    this.searchByTag()
    this.searchByKeyword()
  },

  async searchByKeyword() {
    wx.showLoading({
      title: "加载中"
    })
    const _data = {
      page: 1,
      pageSize: 500
    }
    if(this.data.name) {
      _data.keywordsLike = this.data.name;
    }
    const res = await WXAPI.cmsArticles(_data)
    wx.hideLoading()
    if(res.code == 0) {
      this.setData({
        articleList: this.data.articleList.concat(res.data)
      })
    }
  },

  async searchByTag() {
    wx.showLoading({
      title: "加载中"
    })
    const _data = {
      page: 1,
      pageSize: 500,
    }
    if(this.data.name) {
      _data.tagsLike = this.data.name
    }
    const res = await WXAPI.cmsArticles(_data)
    wx.hideLoading()
    if(res.code == 0) {
      this.setData({
        articleList: this.data.articleList.concat(res.data)
      })
    }
  },

  async searchByTitle() {
    //搜索内容
    wx.showLoading({
      title: "加载中",
    })
    const _data = {
      page: 1,
      pageSize: 500,
    }
    if(this.data.name) {
      // _data.titleLike = this.data.name
      // _data.tagsLike = this.data.name
      _data.kewordsLike = this.data.name
    }
    if(this.data.categoryId) {
      _data.categoryId = this.data.categoryId
    }
    const res = await WXAPI.cmsArticles(_data)
    wx.hideLoading()
    console.log(res.data)
    if(res.code == 0) {
      this.setData({
        articleList: this.data.articleList.concat(res.data)
      })
    }
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

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})
