const WXAPI = require('apifm-wxapi')
const maxSmallCategoryNumber = 3; // 二级分类每列最多显示多少个

Page({
  /**
   * 页面的初始数据
   */
  data: {
    inputVal: "", // 搜索框内容
    cmsCategories: undefined, // 分类列表
    cmsRecommendCategories: undefined, // 推荐的分类列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    // 加载所有的分类数据
    const cmsCategories = await WXAPI.cmsCategories();
    if (cmsCategories.code == 0) {
      const _cmsCategories = cmsCategories.data; // 所有分类数据
      // 筛选推荐的分类
      const cmsRecommendCategories = _cmsCategories.filter(entity => {
        return entity.type == 'recommend';
      });
      // 一级分类下面，构造 swiper-item 数组
      _cmsCategories.filter(entity => {
        return entity.level == 1;
      }).forEach(bigCategory => {
        let tmpNumber = 0;
        bigCategory.swiperItems = [];
        bigCategory.swiperItems.push([]);
        const smallCategories = _cmsCategories.filter(entity => {
          return entity.pid == bigCategory.id;
        });
        while (smallCategories && smallCategories.length > 0) {
          const small = smallCategories.splice(0, 1);
          let swiperItemsLength = bigCategory.swiperItems.length;
          if (bigCategory.swiperItems[swiperItemsLength - 1].length >= maxSmallCategoryNumber) {
            bigCategory.swiperItems.push([]);
            swiperItemsLength++;
          }
          bigCategory.swiperItems[swiperItemsLength - 1].push(small[0]);
        }
        console.log(bigCategory);
      });
      this.setData({
        cmsCategories: _cmsCategories,
        cmsRecommendCategories: cmsRecommendCategories
      });
    }
    // 设置小程序名称
    wx.setNavigationBarTitle({
      title: wx.getStorageSync('mallName')
    })
  },

  goArticleList(e){
    wx.navigateTo({
      url: '/pages/article-list/index?pid=' + e.currentTarget.dataset.id
    })
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
      url: '/pages/article-list/index?name=' + this.data.inputVal,
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})
