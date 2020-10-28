const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const TOOLS = require('../../utils/tools.js') // TOOLS.showTabBarBadge();
const CONFIG = require('../../config.js')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    categories: [],
    categorySelected: {
      name: '',
      id: ''
    },
    videoCategories: [],

    recommendVideos: [],
    currentVideos: [],

    onLoadStatus: true,
    scrolltop: 0,

    skuCurGoods: undefined
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    wx.showShareMenu({
      withShareTicket: true
    })
    this.categories();

  },

  async getVideoCategories() {
    let _this = this
    let categoryId = CONFIG.videoCategoryId
    const _videos = _this.data.categories.filter(ele=> {
      return ele.pid == categoryId
    })
    let categories = [];
    // let recommends = {'categoryName': '精选', 'categoryId': '0'}
    categories.push(recommends)

    for(let i=0; i<_videos.length; i++) {
      let item = _videos[i];
      categories.push(item);
    }
    _this.setData({
      videoCategories: categories
    })
  },


  async categories() {
    wx.showLoading({
      title: '加载中',
    })
    const res = await WXAPI.goodsCategory()
    wx.hideLoading()
    let categories = [];
    let categoryName = '';
    let categoryId = '';
    let recommendStatus = '';
    let recommends ={name: '精选', id: CONFIG.videoCategoryId, level: 2, recommendStatus: 1}
    categories.push(recommends)

    categoryName = recommends.name
    categoryId = recommends.id
    recommendStatus = recommends.recommendStatus

    if (res.code == 0) {
      if (this.data.categorySelected.id) {
        const _curCategory = res.data.find(ele => {
          return ele.id == this.data.categorySelected.id
        })
        categoryName = _curCategory.name;
        categoryId = _curCategory.id;
        recommendStatus = '';
      }
      for (let i = 0; i < res.data.length; i++) {
        let item = res.data[i];
        categories.push(item);
        if (i == 0 && !this.data.categorySelected.id) {
          categoryName = item.name;
          categoryId = item.id;
          recommendStatus = '';
        }
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

    // this.getVideoCategories();


    // this.getRecommendVideosList();
  },

  async getRecommendVideosList() {
    const res =await WXAPI.goods({
      recommendStatus: 1
    })

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
        recommendVideos: res.data
      })
    }
  },

  async getVideosList() {
    wx.showLoading({
      title: '加载中',
    })
    var res;
    if(this.data.categorySelected.recommendStatus) {
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
    this.setData({
      currentVideos: res.data
    });
  },
  toDetailsTap: function(e) {
    wx.navigateTo({
      url: "/pages/goods-details/index?id=" + e.currentTarget.dataset.id
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
      for (var i = 0; i < that.data.categories.length; i++) {
        let item = that.data.categories[i];
        if (item.id == id) {
          categoryName = item.name;
          break;
        }
      }
      that.setData({
        categorySelected: {
          name: categoryName,
          id: id
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

})
