/**
 * 出生地区选项：供下拉选择，value 用于传送后端获取经纬度
 * 格式：中国为「省,市」或「直辖市」；台湾/香港/澳门/东南亚为「地区,城市」或单地名
 */

export interface RegionOption {
  value: string
  label: string
}

export interface RegionGroup {
  groupLabel: string
  options: RegionOption[]
}

/** 中国大陆：直辖市 + 各省及主要城市 */
const 中国大陆: RegionOption[] = [
  { value: '中国,北京市', label: '北京市' },
  { value: '中国,上海市', label: '上海市' },
  { value: '中国,天津市', label: '天津市' },
  { value: '中国,重庆市', label: '重庆市' },
  // 广东省
  { value: '中国,广东省,广州市', label: '广东省 广州市' },
  { value: '中国,广东省,深圳市', label: '广东省 深圳市' },
  { value: '中国,广东省,珠海市', label: '广东省 珠海市' },
  { value: '中国,广东省,东莞市', label: '广东省 东莞市' },
  { value: '中国,广东省,佛山市', label: '广东省 佛山市' },
  { value: '中国,广东省,惠州市', label: '广东省 惠州市' },
  { value: '中国,广东省,中山市', label: '广东省 中山市' },
  { value: '中国,广东省,江门市', label: '广东省 江门市' },
  { value: '中国,广东省,汕头市', label: '广东省 汕头市' },
  { value: '中国,广东省,湛江市', label: '广东省 湛江市' },
  // 江苏省
  { value: '中国,江苏省,南京市', label: '江苏省 南京市' },
  { value: '中国,江苏省,苏州市', label: '江苏省 苏州市' },
  { value: '中国,江苏省,无锡市', label: '江苏省 无锡市' },
  { value: '中国,江苏省,常州市', label: '江苏省 常州市' },
  { value: '中国,江苏省,南通市', label: '江苏省 南通市' },
  { value: '中国,江苏省,徐州市', label: '江苏省 徐州市' },
  { value: '中国,江苏省,扬州市', label: '江苏省 扬州市' },
  // 浙江省
  { value: '中国,浙江省,杭州市', label: '浙江省 杭州市' },
  { value: '中国,浙江省,宁波市', label: '浙江省 宁波市' },
  { value: '中国,浙江省,温州市', label: '浙江省 温州市' },
  { value: '中国,浙江省,嘉兴市', label: '浙江省 嘉兴市' },
  { value: '中国,浙江省,金华市', label: '浙江省 金华市' },
  { value: '中国,浙江省,绍兴市', label: '浙江省 绍兴市' },
  // 山东省
  { value: '中国,山东省,济南市', label: '山东省 济南市' },
  { value: '中国,山东省,青岛市', label: '山东省 青岛市' },
  { value: '中国,山东省,烟台市', label: '山东省 烟台市' },
  { value: '中国,山东省,潍坊市', label: '山东省 潍坊市' },
  { value: '中国,山东省,临沂市', label: '山东省 临沂市' },
  // 四川省
  { value: '中国,四川省,成都市', label: '四川省 成都市' },
  { value: '中国,四川省,绵阳市', label: '四川省 绵阳市' },
  { value: '中国,四川省,德阳市', label: '四川省 德阳市' },
  { value: '中国,四川省,南充市', label: '四川省 南充市' },
  { value: '中国,四川省,宜宾市', label: '四川省 宜宾市' },
  // 湖北省
  { value: '中国,湖北省,武汉市', label: '湖北省 武汉市' },
  { value: '中国,湖北省,宜昌市', label: '湖北省 宜昌市' },
  { value: '中国,湖北省,襄阳市', label: '湖北省 襄阳市' },
  // 湖南省
  { value: '中国,湖南省,长沙市', label: '湖南省 长沙市' },
  { value: '中国,湖南省,株洲市', label: '湖南省 株洲市' },
  { value: '中国,湖南省,湘潭市', label: '湖南省 湘潭市' },
  { value: '中国,湖南省,衡阳市', label: '湖南省 衡阳市' },
  // 河南省
  { value: '中国,河南省,郑州市', label: '河南省 郑州市' },
  { value: '中国,河南省,洛阳市', label: '河南省 洛阳市' },
  { value: '中国,河南省,开封市', label: '河南省 开封市' },
  { value: '中国,河南省,南阳市', label: '河南省 南阳市' },
  // 福建省
  { value: '中国,福建省,福州市', label: '福建省 福州市' },
  { value: '中国,福建省,厦门市', label: '福建省 厦门市' },
  { value: '中国,福建省,泉州市', label: '福建省 泉州市' },
  { value: '中国,福建省,漳州市', label: '福建省 漳州市' },
  // 陕西省
  { value: '中国,陕西省,西安市', label: '陕西省 西安市' },
  { value: '中国,陕西省,咸阳市', label: '陕西省 咸阳市' },
  { value: '中国,陕西省,宝鸡市', label: '陕西省 宝鸡市' },
  // 辽宁省
  { value: '中国,辽宁省,沈阳市', label: '辽宁省 沈阳市' },
  { value: '中国,辽宁省,大连市', label: '辽宁省 大连市' },
  { value: '中国,辽宁省,鞍山市', label: '辽宁省 鞍山市' },
  // 吉林省
  { value: '中国,吉林省,长春市', label: '吉林省 长春市' },
  { value: '中国,吉林省,吉林市', label: '吉林省 吉林市' },
  // 黑龙江省
  { value: '中国,黑龙江省,哈尔滨市', label: '黑龙江省 哈尔滨市' },
  { value: '中国,黑龙江省,齐齐哈尔市', label: '黑龙江省 齐齐哈尔市' },
  { value: '中国,黑龙江省,大庆市', label: '黑龙江省 大庆市' },
  // 安徽省
  { value: '中国,安徽省,合肥市', label: '安徽省 合肥市' },
  { value: '中国,安徽省,芜湖市', label: '安徽省 芜湖市' },
  { value: '中国,安徽省,蚌埠市', label: '安徽省 蚌埠市' },
  { value: '中国,安徽省,淮南市', label: '安徽省 淮南市' },
  // 江西省
  { value: '中国,江西省,南昌市', label: '江西省 南昌市' },
  { value: '中国,江西省,赣州市', label: '江西省 赣州市' },
  { value: '中国,江西省,九江市', label: '江西省 九江市' },
  // 云南省
  { value: '中国,云南省,昆明市', label: '云南省 昆明市' },
  { value: '中国,云南省,大理市', label: '云南省 大理市' },
  { value: '中国,云南省,丽江市', label: '云南省 丽江市' },
  // 贵州省
  { value: '中国,贵州省,贵阳市', label: '贵州省 贵阳市' },
  { value: '中国,贵州省,遵义市', label: '贵州省 遵义市' },
  // 广西壮族自治区
  { value: '中国,广西壮族自治区,南宁市', label: '广西 南宁市' },
  { value: '中国,广西壮族自治区,桂林市', label: '广西 桂林市' },
  { value: '中国,广西壮族自治区,柳州市', label: '广西 柳州市' },
  // 海南省
  { value: '中国,海南省,海口市', label: '海南省 海口市' },
  { value: '中国,海南省,三亚市', label: '海南省 三亚市' },
  // 河北省
  { value: '中国,河北省,石家庄市', label: '河北省 石家庄市' },
  { value: '中国,河北省,唐山市', label: '河北省 唐山市' },
  { value: '中国,河北省,保定市', label: '河北省 保定市' },
  // 山西省
  { value: '中国,山西省,太原市', label: '山西省 太原市' },
  { value: '中国,山西省,大同市', label: '山西省 大同市' },
  // 内蒙古自治区
  { value: '中国,内蒙古自治区,呼和浩特市', label: '内蒙古 呼和浩特市' },
  { value: '中国,内蒙古自治区,包头市', label: '内蒙古 包头市' },
  // 甘肃省
  { value: '中国,甘肃省,兰州市', label: '甘肃省 兰州市' },
  // 青海省
  { value: '中国,青海省,西宁市', label: '青海省 西宁市' },
  // 宁夏回族自治区
  { value: '中国,宁夏回族自治区,银川市', label: '宁夏 银川市' },
  // 新疆维吾尔自治区
  { value: '中国,新疆维吾尔自治区,乌鲁木齐市', label: '新疆 乌鲁木齐市' },
  { value: '中国,新疆维吾尔自治区,喀什市', label: '新疆 喀什市' },
  // 西藏自治区
  { value: '中国,西藏自治区,拉萨市', label: '西藏 拉萨市' },
]

/** 台湾：县市 */
const 台湾: RegionOption[] = [
  { value: '台湾,台北市', label: '台北市' },
  { value: '台湾,新北市', label: '新北市' },
  { value: '台湾,桃园市', label: '桃园市' },
  { value: '台湾,台中市', label: '台中市' },
  { value: '台湾,台南市', label: '台南市' },
  { value: '台湾,高雄市', label: '高雄市' },
  { value: '台湾,基隆市', label: '基隆市' },
  { value: '台湾,新竹市', label: '新竹市' },
  { value: '台湾,嘉义市', label: '嘉义市' },
  { value: '台湾,宜兰县', label: '宜兰县' },
  { value: '台湾,新竹县', label: '新竹县' },
  { value: '台湾,苗栗县', label: '苗栗县' },
  { value: '台湾,彰化县', label: '彰化县' },
  { value: '台湾,南投县', label: '南投县' },
  { value: '台湾,云林县', label: '云林县' },
  { value: '台湾,嘉义县', label: '嘉义县' },
  { value: '台湾,屏东县', label: '屏东县' },
  { value: '台湾,花莲县', label: '花莲县' },
  { value: '台湾,台东县', label: '台东县' },
  { value: '台湾,澎湖县', label: '澎湖县' },
]

/** 香港 */
const 香港: RegionOption[] = [
  { value: '香港', label: '香港' },
  { value: '香港,香港岛', label: '香港岛' },
  { value: '香港,九龙', label: '九龙' },
  { value: '香港,新界', label: '新界' },
]

/** 澳门 */
const 澳门: RegionOption[] = [
  { value: '澳门', label: '澳门' },
  { value: '澳门,澳门半岛', label: '澳门半岛' },
  { value: '澳门,氹仔', label: '氹仔' },
  { value: '澳门,路环', label: '路环' },
]

/** 东南亚：国家及主要城市 */
const 东南亚: RegionOption[] = [
  { value: '新加坡,新加坡', label: '新加坡' },
  { value: '马来西亚,吉隆坡', label: '马来西亚 吉隆坡' },
  { value: '马来西亚,槟城', label: '马来西亚 槟城' },
  { value: '马来西亚,新山', label: '马来西亚 新山' },
  { value: '泰国,曼谷', label: '泰国 曼谷' },
  { value: '泰国,清迈', label: '泰国 清迈' },
  { value: '泰国,普吉', label: '泰国 普吉' },
  { value: '越南,河内', label: '越南 河内' },
  { value: '越南,胡志明市', label: '越南 胡志明市' },
  { value: '越南,岘港', label: '越南 岘港' },
  { value: '菲律宾,马尼拉', label: '菲律宾 马尼拉' },
  { value: '菲律宾,宿务', label: '菲律宾 宿务' },
  { value: '印度尼西亚,雅加达', label: '印度尼西亚 雅加达' },
  { value: '印度尼西亚,巴厘岛', label: '印度尼西亚 巴厘岛' },
  { value: '印度尼西亚,泗水', label: '印度尼西亚 泗水' },
  { value: '缅甸,仰光', label: '缅甸 仰光' },
  { value: '缅甸,曼德勒', label: '缅甸 曼德勒' },
  { value: '柬埔寨,金边', label: '柬埔寨 金边' },
  { value: '柬埔寨,暹粒', label: '柬埔寨 暹粒' },
  { value: '老挝,万象', label: '老挝 万象' },
  { value: '老挝,琅勃拉邦', label: '老挝 琅勃拉邦' },
  { value: '文莱,斯里巴加湾', label: '文莱 斯里巴加湾' },
]

export const REGION_GROUPS: RegionGroup[] = [
  { groupLabel: '中国大陆', options: 中国大陆 },
  { groupLabel: '台湾', options: 台湾 },
  { groupLabel: '香港', options: 香港 },
  { groupLabel: '澳门', options: 澳门 },
  { groupLabel: '东南亚', options: 东南亚 },
]

/** 根据 value 取展示用 label，供下拉框显示已选项 */
export function getRegionLabelByValue(value: string): string {
  for (const { options } of REGION_GROUPS) {
    const found = options.find((o) => o.value === value)
    if (found) return found.label
  }
  return ''
}
