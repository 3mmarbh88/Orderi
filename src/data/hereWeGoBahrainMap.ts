/**
 * HERE WeGo - Bahrain Places, Malls, Souqs, and Commercial Landmarks Database
 * قاعدة بيانات الخرائط والمعالم والمجمعات التجارية والأسواق والمستشفيات لمملكة البحرين
 * مستوحاة ومطابقة لبيانات خرائط HERE WeGo لضمان سرعة التحليل والوصول للبيانات عبر الذكاء الاصطناعي.
 */

import { normalizeArabicText } from './bahrainAreas';

export type HereWeGoCategory =
  | 'mall'            // مجمعات ومولات تجارية
  | 'souq'            // أسواق شعبية وتراثية
  | 'hypermarket'     // هايبرماركت وسوبرماركت كبرى
  | 'dining_hub'      // شوارع ومناطق مطاعم وكافيهات
  | 'hospital'        // مستشفيات ومراكز صحية
  | 'university'      // جامعات ومعاهد تعليمية
  | 'landmark'        // معالم سياحية ومطارات ومنافذ
  | 'industrial'      // مناطق وموانئ صناعية
  | 'residential';    // إسكانات وأحياء وتجمعات سكنية

export interface HereWeGoPlace {
  id: string;
  name: string;
  nameEn: string;
  category: HereWeGoCategory;
  categoryLabel: string;
  parentAreaName: string; // المنطقة الجغرافية التابعة لها (الرفاع، المنامة، المحرق، إلخ)
  governorate: 'العاصمة' | 'المحرق' | 'الشمالية' | 'الجنوبية';
  latitude: number;
  longitude: number;
  keywords: string[];
}

export const HERE_WE_GO_BAHRAIN_PLACES: HereWeGoPlace[] = [
  // ==========================================
  // 1. المجمعات والمولات التجارية (MALLS)
  // ==========================================
  {
    id: 'hwg_city_centre',
    name: 'سيتي سنتر البحرين',
    nameEn: 'City Centre Bahrain',
    category: 'mall',
    categoryLabel: 'مجمع تجاري',
    parentAreaName: 'السيف',
    governorate: 'العاصمة',
    latitude: 26.2340,
    longitude: 50.5520,
    keywords: ['سيتي سنتر', 'سيتي سنتر البحرين', 'ستي سنتر', 'ستي سنتر السيف', 'city centre', 'city center', 'bahrain city centre', 'كارفور سيتي سنتر', 'سينما سيتي سنتر', 'ماجيك بلانيت سيتي سنتر'],
  },
  {
    id: 'hwg_seef_mall',
    name: 'مجمع السيف',
    nameEn: 'Seef Mall',
    category: 'mall',
    categoryLabel: 'مجمع تجاري',
    parentAreaName: 'السيف',
    governorate: 'العاصمة',
    latitude: 26.2410,
    longitude: 50.5360,
    keywords: ['مجمع السيف', 'السيف مول', 'سيف مول', 'سيف المنامة', 'seef mall', 'seefmall', 'سينما السيف', 'يانو السيف'],
  },
  {
    id: 'hwg_the_avenues',
    name: 'الأفنيوز البحرين',
    nameEn: 'The Avenues Bahrain',
    category: 'mall',
    categoryLabel: 'مجمع تجاري وواجهة بحرية',
    parentAreaName: 'المنامة',
    governorate: 'العاصمة',
    latitude: 26.2435,
    longitude: 50.5840,
    keywords: ['الافنيوز', 'الأفنيوز', 'افنيوز', 'افنيوز البحرين', 'the avenues', 'avenues mall', 'واجهة الافنيوز البحرية', 'كورنيش الافنيوز'],
  },
  {
    id: 'hwg_marassi_galleria',
    name: 'مراسي جاليريا',
    nameEn: 'Marassi Galleria',
    category: 'mall',
    categoryLabel: 'مجمع تجاري شاطئي',
    parentAreaName: 'ديار المحرق',
    governorate: 'المحرق',
    latitude: 26.2940,
    longitude: 50.6410,
    keywords: ['مراسي', 'مراسي جاليريا', 'مجمع مراسي', 'مراسي البحرين', 'شاطئ مراسي', 'marassi galleria', 'marassi mall', 'marassi bahrain'],
  },
  {
    id: 'hwg_moda_mall',
    name: 'مودا مول',
    nameEn: 'Moda Mall',
    category: 'mall',
    categoryLabel: 'مجمع تجاري فاخر',
    parentAreaName: 'المنامة',
    governorate: 'العاصمة',
    latitude: 26.2370,
    longitude: 50.5820,
    keywords: ['مودا مول', 'مودامول', 'مركز البحرين التجاري العالمي', 'برج التجارة العالمي', 'فندق الشيراتون', 'moda mall', 'bwtc'],
  },
  {
    id: 'hwg_al_aali_mall',
    name: 'مجمع العالي',
    nameEn: 'Al Aali Mall',
    category: 'mall',
    categoryLabel: 'مجمع تجاري',
    parentAreaName: 'السيف',
    governorate: 'العاصمة',
    latitude: 26.2390,
    longitude: 50.5340,
    keywords: ['مجمع العالي', 'العالي مول', 'عالي مول', 'al aali mall', 'alaali mall'],
  },
  {
    id: 'hwg_mall_of_dilmunia',
    name: 'مجمع دلمونيا',
    nameEn: 'Mall of Dilmunia',
    category: 'mall',
    categoryLabel: 'مجمع تجاري وترفيهي',
    parentAreaName: 'جزيرة دلمونيا',
    governorate: 'المحرق',
    latitude: 26.2910,
    longitude: 50.6650,
    keywords: ['دلمونيا', 'مجمع دلمونيا', 'مول دلمونيا', 'جزيرة دلمونيا', 'حوض دلمونيا المائي', 'mall of dilmunia', 'dilmunia mall'],
  },
  {
    id: 'hwg_al_liwan',
    name: 'مجمع الليوان',
    nameEn: 'Al Liwan Hamala',
    category: 'mall',
    categoryLabel: 'مجمع تجاري مفتوح ومطاعم',
    parentAreaName: 'الهملة',
    governorate: 'الشمالية',
    latitude: 26.1680,
    longitude: 50.4850,
    keywords: ['الليوان', 'مجمع الليوان', 'ليوان الهملة', 'الليوان الهملة', 'al liwan', 'alliwan'],
  },
  {
    id: 'hwg_enma_mall',
    name: 'مجمع الإنماء',
    nameEn: 'Enma Mall',
    category: 'mall',
    categoryLabel: 'مجمع تجاري',
    parentAreaName: 'الرفاع الشرقي',
    governorate: 'الجنوبية',
    latitude: 26.1260,
    longitude: 50.5740,
    keywords: ['مجمع الإنماء', 'مجمع الانماء', 'الإنماء مول', 'انماء مول الرفاع', 'enma mall', 'كارفور الإنماء'],
  },
  {
    id: 'hwg_ramli_mall',
    name: 'مجمع الرملي',
    nameEn: 'Ramli Mall',
    category: 'mall',
    categoryLabel: 'مجمع تجاري',
    parentAreaName: 'عالي',
    governorate: 'الشمالية',
    latitude: 26.1710,
    longitude: 50.5400,
    keywords: ['مجمع الرملي', 'الرملي مول', 'رملي مول عالي', 'لولو الرملي', 'ramli mall'],
  },
  {
    id: 'hwg_oasis_mall_juffair',
    name: 'الواحة مول الجفير',
    nameEn: 'Oasis Mall Juffair',
    category: 'mall',
    categoryLabel: 'مجمع تجاري',
    parentAreaName: 'الجفير',
    governorate: 'العاصمة',
    latitude: 26.2160,
    longitude: 50.6030,
    keywords: ['الواحة مول الجفير', 'واحة الجفير', 'مجمع الواحة الجفير', 'oasis mall juffair', 'سينما الواحة الجفير'],
  },
  {
    id: 'hwg_oasis_mall_muharraq',
    name: 'الواحة مول المحرق',
    nameEn: 'Oasis Mall Muharraq',
    category: 'mall',
    categoryLabel: 'مجمع تجاري',
    parentAreaName: 'المحرق',
    governorate: 'المحرق',
    latitude: 26.2520,
    longitude: 50.6180,
    keywords: ['الواحة مول المحرق', 'واحة المحرق', 'مجمع الواحة المحرق', 'oasis mall muharraq', 'جسر الشيخ عيسى الواحة'],
  },
  {
    id: 'hwg_oasis_mall_riffa',
    name: 'الواحة مول الرفاع',
    nameEn: 'Oasis Mall Riffa',
    category: 'mall',
    categoryLabel: 'مجمع تجاري',
    parentAreaName: 'الرفاع الشرقي',
    governorate: 'الجنوبية',
    latitude: 26.1210,
    longitude: 50.5650,
    keywords: ['الواحة مول الرفاع', 'واحة الرفاع', 'oasis mall riffa'],
  },
  {
    id: 'hwg_dana_mall',
    name: 'مجمع الدانة',
    nameEn: 'Dana Mall',
    category: 'mall',
    categoryLabel: 'مجمع تجاري',
    parentAreaName: 'السنابس',
    governorate: 'العاصمة',
    latitude: 26.2270,
    longitude: 50.5510,
    keywords: ['مجمع الدانة', 'الدانة مول', 'دانه مول السنابس', 'لولو هايبر الدانة', 'dana mall', 'danamall'],
  },
  {
    id: 'hwg_marina_mall',
    name: 'مارينا مول',
    nameEn: 'Marina Mall',
    category: 'mall',
    categoryLabel: 'مجمع تجاري',
    parentAreaName: 'المنامة',
    governorate: 'العاصمة',
    latitude: 26.2260,
    longitude: 50.5690,
    keywords: ['مارينا مول', 'مارينا مول المنامة', 'المركاز مارينا', 'marina mall'],
  },
  {
    id: 'hwg_saar_mall',
    name: 'مجمع سار',
    nameEn: 'Saar Mall',
    category: 'mall',
    categoryLabel: 'مجمع تجاري',
    parentAreaName: 'سار',
    governorate: 'الشمالية',
    latitude: 26.2080,
    longitude: 50.5050,
    keywords: ['مجمع سار', 'سار مول', 'saar mall', 'saarmall'],
  },
  {
    id: 'hwg_reef_mall',
    name: 'مجمع الريف',
    nameEn: 'Reef Mall',
    category: 'mall',
    categoryLabel: 'مجمع تجاري',
    parentAreaName: 'الهملة',
    governorate: 'الشمالية',
    latitude: 26.1720,
    longitude: 50.4790,
    keywords: ['مجمع الريف', 'الريف مول', 'ريف مول الهملة', 'reef mall'],
  },
  {
    id: 'hwg_sitra_mall',
    name: 'مجمع سترة',
    nameEn: 'Sitra Mall',
    category: 'mall',
    categoryLabel: 'مجمع تجاري',
    parentAreaName: 'سترة',
    governorate: 'العاصمة',
    latitude: 26.1680,
    longitude: 50.6080,
    keywords: ['مجمع سترة', 'سترة مول', 'sitra mall'],
  },
  {
    id: 'hwg_yateem_centre',
    name: 'مجمع يتيم',
    nameEn: 'Yateem Centre',
    category: 'mall',
    categoryLabel: 'مجمع تجاري تاريخي',
    parentAreaName: 'المنامة',
    governorate: 'العاصمة',
    latitude: 26.2330,
    longitude: 50.5750,
    keywords: ['مجمع يتيم', 'يتيم سنتر', 'سوق يتيم', 'yateem centre', 'yateem center'],
  },
  {
    id: 'hwg_gosi_mall',
    name: 'مجمع التأمينات الاجتماعية (التأمينات)',
    nameEn: 'GOSI Complex',
    category: 'mall',
    categoryLabel: 'مجمع تجاري وإلكترونيات',
    parentAreaName: 'الحورة',
    governorate: 'العاصمة',
    latitude: 26.2370,
    longitude: 50.5900,
    keywords: ['مجمع التأمينات', 'التأمينات', 'سوق الهواتف التأمينات', 'مجمع جوزي', 'gosi complex', 'gosi mall'],
  },

  // ==========================================
  // 2. الأسواق التراثية والشعبية (SOUQS)
  // ==========================================
  {
    id: 'hwg_bab_al_bahrain',
    name: 'باب البحرين وسوق المنامة القديم',
    nameEn: 'Bab Al Bahrain & Manama Souq',
    category: 'souq',
    categoryLabel: 'سوق تراثي وشعبي',
    parentAreaName: 'المنامة',
    governorate: 'العاصمة',
    latitude: 26.2345,
    longitude: 50.5745,
    keywords: ['باب البحرين', 'سوق المنامة', 'سوق المنامة القديم', 'سوق الذهب المنامة', 'bab al bahrain', 'manama souq', 'old manama market'],
  },
  {
    id: 'hwg_souq_waqif_hamad',
    name: 'سوق واقف مدينة حمد',
    nameEn: 'Souq Waqif Hamad Town',
    category: 'souq',
    categoryLabel: 'سوق شعبي وحيوي',
    parentAreaName: 'مدينة حمد',
    governorate: 'الشمالية',
    latitude: 26.1430,
    longitude: 50.5050,
    keywords: ['سوق واقف', 'سوق واقف مدينة حمد', 'سوق واقف البحرين', 'souq waqif', 'سوق واقف دوار 1'],
  },
  {
    id: 'hwg_muharraq_souq',
    name: 'سوق المحرق الشعبي والقيصرية',
    nameEn: 'Muharraq Traditional Souq & Al Qaisariya',
    category: 'souq',
    categoryLabel: 'سوق تراثي وشعبي',
    parentAreaName: 'المحرق',
    governorate: 'المحرق',
    latitude: 26.2550,
    longitude: 50.6120,
    keywords: ['سوق المحرق', 'سوق القيصرية', 'القيصرية المحرق', 'سوق المحرق القديم', 'سوق الحلوى المحرق', 'حلويات شويطر المحرق', 'muharraq souq', 'al qaisariya'],
  },
  {
    id: 'hwg_jidhafs_souq',
    name: 'سوق جدحفص الشعبي',
    nameEn: 'Jidhafs Central Market',
    category: 'souq',
    categoryLabel: 'سوق شعبي للمواد الغذائية والأسماك',
    parentAreaName: 'جدحفص',
    governorate: 'الشمالية',
    latitude: 26.2190,
    longitude: 50.5480,
    keywords: ['سوق جدحفص', 'سوق السمك جدحفص', 'سوق الخضار جدحفص', 'jidhafs souq', 'jidhafs market'],
  },
  {
    id: 'hwg_manama_central_market',
    name: 'سوق المنامة المركزي',
    nameEn: 'Manama Central Market',
    category: 'souq',
    categoryLabel: 'السوق المركزي الرئيسي',
    parentAreaName: 'المنامة',
    governorate: 'العاصمة',
    latitude: 26.2230,
    longitude: 50.5650,
    keywords: ['سوق المنامة المركزي', 'السوق المركزي', 'سوق السمك المنامة', 'سوق الخضار المركزي', 'manama central market', 'central market'],
  },
  {
    id: 'hwg_farmers_market_budaiya',
    name: 'سوق المزارعين حديقة البديع',
    nameEn: 'Bahrain Farmers Market Budaiya',
    category: 'souq',
    categoryLabel: 'سوق زراعي وسياحي',
    parentAreaName: 'البديع',
    governorate: 'الشمالية',
    latitude: 26.2190,
    longitude: 50.4810,
    keywords: ['سوق المزارعين', 'سوق المزارعين البديع', 'حديقة البديع النباتية', 'farmers market', 'budaiya botanical garden'],
  },
  {
    id: 'hwg_gold_souq',
    name: 'سوق الذهب القديم والجديد',
    nameEn: 'Bahrain Gold Souq',
    category: 'souq',
    categoryLabel: 'سوق الذهب والمجوهرات',
    parentAreaName: 'المنامة',
    governorate: 'العاصمة',
    latitude: 26.2360,
    longitude: 50.5760,
    keywords: ['سوق الذهب', 'سوق الذهب المنامة', 'مركز الذهب التجاري', 'gold souq', 'gold market'],
  },

  // ==========================================
  // 3. كبرى شبكات الهايبرماركت ومراكز التسوق (HYPERMARKETS)
  // ==========================================
  {
    id: 'hwg_lulu_hidd',
    name: 'لولو هايبرماركت الحد',
    nameEn: 'Lulu Hypermarket Hidd',
    category: 'hypermarket',
    categoryLabel: 'هايبرماركت',
    parentAreaName: 'الحد',
    governorate: 'المحرق',
    latitude: 26.2420,
    longitude: 50.6480,
    keywords: ['لولو الحد', 'لولو هايبر ماركت الحد', 'لولو هايبرماركت الحد', 'lulu hidd'],
  },
  {
    id: 'hwg_lulu_dana',
    name: 'لولو هايبرماركت مجمع الدانة السنابس',
    nameEn: 'Lulu Hypermarket Dana Mall',
    category: 'hypermarket',
    categoryLabel: 'هايبرماركت',
    parentAreaName: 'السنابس',
    governorate: 'العاصمة',
    latitude: 26.2270,
    longitude: 50.5510,
    keywords: ['لولو الدانة', 'لولو السنابس', 'لولو مجمع الدانة', 'lulu dana mall'],
  },
  {
    id: 'hwg_lulu_riffa',
    name: 'لولو هايبرماركت الرفاع',
    nameEn: 'Lulu Hypermarket East Riffa',
    category: 'hypermarket',
    categoryLabel: 'هايبرماركت',
    parentAreaName: 'الرفاع الشرقي',
    governorate: 'الجنوبية',
    latitude: 26.1280,
    longitude: 50.5690,
    keywords: ['لولو الرفاع', 'لولو هايبر ماركت الرفاع', 'lulu riffa'],
  },
  {
    id: 'hwg_lulu_zinj',
    name: 'لولو هايبرماركت الزنج (غاليريا مول)',
    nameEn: 'Lulu Hypermarket Galleria Zinj',
    category: 'hypermarket',
    categoryLabel: 'هايبرماركت',
    parentAreaName: 'الزنج',
    governorate: 'العاصمة',
    latitude: 26.2040,
    longitude: 50.5750,
    keywords: ['لولو الزنج', 'غاليريا الزنج', 'مجمع غاليريا', 'lulu zinj', 'galleria mall zinj'],
  },
  {
    id: 'hwg_ramez_hypermarket_manama',
    name: 'رامز هايبرماركت المنامة',
    nameEn: 'Ramez Hypermarket Manama',
    category: 'hypermarket',
    categoryLabel: 'هايبرماركت وتجزئة',
    parentAreaName: 'المنامة',
    governorate: 'العاصمة',
    latitude: 26.2250,
    longitude: 50.5680,
    keywords: ['رامز المنامة', 'رامز هايبرماركت', 'اسواق رامز', 'ramez manama', 'ramez'],
  },
  {
    id: 'hwg_ramez_tubli',
    name: 'رامز هايبرماركت توبلي',
    nameEn: 'Ramez Hypermarket Tubli',
    category: 'hypermarket',
    categoryLabel: 'هايبرماركت وتجزئة',
    parentAreaName: 'توبلي',
    governorate: 'العاصمة',
    latitude: 26.1860,
    longitude: 50.5550,
    keywords: ['رامز توبلي', 'اسواق رامز توبلي', 'ramez tubli'],
  },
  {
    id: 'hwg_ramez_riffa',
    name: 'رامز هايبرماركت الرفاع بوكوارة',
    nameEn: 'Ramez Hypermarket Riffa',
    category: 'hypermarket',
    categoryLabel: 'هايبرماركت وتجزئة',
    parentAreaName: 'الرفاع الشرقي',
    governorate: 'الجنوبية',
    latitude: 26.1330,
    longitude: 50.5650,
    keywords: ['رامز الرفاع', 'رامز بوكوارة', 'اسواق رامز الرفاع', 'ramez riffa'],
  },
  {
    id: 'hwg_ansar_gallery_tubli',
    name: 'أنصار جاليري توبلي',
    nameEn: 'Ansar Gallery Tubli',
    category: 'hypermarket',
    categoryLabel: 'مركز تجزئة ومفروشات كبرى',
    parentAreaName: 'توبلي',
    governorate: 'العاصمة',
    latitude: 26.1890,
    longitude: 50.5580,
    keywords: ['انصار جاليري', 'أنصار جاليري', 'انصار توبلي', 'ansar gallery', 'ansar gallery tubli'],
  },
  {
    id: 'hwg_alhelli_supermarkets',
    name: 'أسواق الحلي (توبلي، جدعلي، عالي)',
    nameEn: 'Al Helli Supermarket',
    category: 'hypermarket',
    categoryLabel: 'سوبرماركت وهايبرماركت',
    parentAreaName: 'توبلي',
    governorate: 'العاصمة',
    latitude: 26.1840,
    longitude: 50.5620,
    keywords: ['اسواق الحلي', 'الحلي توبلي', 'الحلي عالي', 'الحلي جدعلي', 'al helli', 'alhelli super market'],
  },
  {
    id: 'hwg_alosra_supermarket',
    name: 'أسواق الأسرة (سار، أمواج، البديع)',
    nameEn: 'Alosra Supermarket',
    category: 'hypermarket',
    categoryLabel: 'سوبرماركت متميز',
    parentAreaName: 'سار',
    governorate: 'الشمالية',
    latitude: 26.2110,
    longitude: 50.5080,
    keywords: ['اسواق الاسرة', 'أسواق الأسرة', 'الاسرة سار', 'الاسرة امواج', 'alosra', 'alosra supermarket'],
  },

  // ==========================================
  // 4. شوارع ومجمعات المطاعم والكافيهات (DINING HUBS)
  // ==========================================
  {
    id: 'hwg_block_338_adliya',
    name: 'بلوك 338 العدلية (حي المطاعم الفنية)',
    nameEn: 'Block 338 Adliya Dining District',
    category: 'dining_hub',
    categoryLabel: 'حي مطاعم وكافيهات عالمية',
    parentAreaName: 'العدلية',
    governorate: 'العاصمة',
    latitude: 26.2155,
    longitude: 50.5935,
    keywords: ['بلوك 338', 'العدلية 338', 'حي المطاعم العدلية', 'مطاعم العدلية', 'block 338', 'adliya 338'],
  },
  {
    id: 'hwg_shabab_avenue_juffair',
    name: 'شارع الشباب الجفير (شارع المطاعم الأمريكية السريعة)',
    nameEn: 'Al Shabab Avenue Juffair',
    category: 'dining_hub',
    categoryLabel: 'شارع مطاعم حيوية',
    parentAreaName: 'الجفير',
    governorate: 'العاصمة',
    latitude: 26.2140,
    longitude: 50.6015,
    keywords: ['شارع الشباب', 'شارع المطاعم الجفير', 'مطاعم الجفير', 'al shabab avenue', 'american alley juffair'],
  },
  {
    id: 'hwg_sanad_restaurant_street',
    name: 'شارع المطاعم سند (شارع 77)',
    nameEn: 'Sanad Restaurant Street (Road 77)',
    category: 'dining_hub',
    categoryLabel: 'شارع مطاعم شعبية وكافيهات',
    parentAreaName: 'سند',
    governorate: 'العاصمة',
    latitude: 26.1550,
    longitude: 50.5750,
    keywords: ['شارع المطاعم سند', 'شارع 77', 'مطاعم سند', 'شارع سند', 'sanad food street', 'road 77'],
  },
  {
    id: 'hwg_bukowarah_riffa',
    name: 'شارع بوكوارة التجاري الرفاع',
    nameEn: 'Bukowarah Commercial & Dining Street Riffa',
    category: 'dining_hub',
    categoryLabel: 'شارع تجاري ومطاعم ومحلات',
    parentAreaName: 'الرفاع الشرقي',
    governorate: 'الجنوبية',
    latitude: 26.1360,
    longitude: 50.5640,
    keywords: ['بوكوارة', 'شارع بوكوارة', 'مطاعم بوكوارة', 'سوق بوكوارة', 'bukowarah', 'bukuwara'],
  },
  {
    id: 'hwg_district_1_hamala',
    name: 'ديستريكت 1 الهملة',
    nameEn: 'District 1 Hamala',
    category: 'dining_hub',
    categoryLabel: 'مجمع مطاعم وكافيهات راقية',
    parentAreaName: 'الهملة',
    governorate: 'الشمالية',
    latitude: 26.1660,
    longitude: 50.4820,
    keywords: ['ديستريكت 1', 'دستركت ون', 'ديستريكت ون الهملة', 'district 1', 'district 1 hamala'],
  },
  {
    id: 'hwg_water_garden_city',
    name: 'ووتر جاردن سيتي السيف',
    nameEn: 'Water Garden City Seef',
    category: 'dining_hub',
    categoryLabel: 'ممشى ومطاعم شاطئية',
    parentAreaName: 'السيف',
    governorate: 'العاصمة',
    latitude: 26.2460,
    longitude: 50.5400,
    keywords: ['ووتر جاردن سيتي', 'ووتر قاردن', 'مطاعم ووتر جاردن', 'water garden city', 'water garden'],
  },
  {
    id: 'hwg_courtyard_seef',
    name: 'كورت يارد السيف',
    nameEn: 'The Courtyard Seef',
    category: 'dining_hub',
    categoryLabel: 'مجمع كافيهات ومطاعم هادئة',
    parentAreaName: 'السيف',
    governorate: 'العاصمة',
    latitude: 26.2405,
    longitude: 50.5310,
    keywords: ['كورت يارد', 'كورت يارد السيف', 'the courtyard seef', 'courtyard'],
  },

  // ==========================================
  // 5. المستشفيات والمراكز الطبية الكبرى (HOSPITALS)
  // ==========================================
  {
    id: 'hwg_salmaniya_hospital',
    name: 'مجمع السلمانية الطبي',
    nameEn: 'Salmaniya Medical Complex (SMC)',
    category: 'hospital',
    categoryLabel: 'المستشفى العام الرئيسي',
    parentAreaName: 'السلمانية',
    governorate: 'العاصمة',
    latitude: 26.2120,
    longitude: 50.5840,
    keywords: ['السلمانية', 'مستشفى السلمانية', 'مجمع السلمانية الطبي', 'طوارئ السلمانية', 'salmaniya medical complex', 'smc'],
  },
  {
    id: 'hwg_king_hamad_hospital',
    name: 'مستشفى الملك حمد الجامعي',
    nameEn: 'King Hamad University Hospital (KHUH)',
    category: 'hospital',
    categoryLabel: 'مستشفى جامعي وتخصصي',
    parentAreaName: 'البسيتين',
    governorate: 'المحرق',
    latitude: 26.2690,
    longitude: 50.6130,
    keywords: ['مستشفى الملك حمد', 'الملك حمد الجامعي', 'مستشفى البسيتين الجامعي', 'king hamad university hospital', 'khuh'],
  },
  {
    id: 'hwg_bdf_hospital',
    name: 'المستشفى العسكري (الخدمات الطبية الملكية)',
    nameEn: 'BDF Hospital (Royal Medical Services)',
    category: 'hospital',
    categoryLabel: 'مستشفى عسكري وتخصصي',
    parentAreaName: 'الرفاع الغربي',
    governorate: 'الجنوبية',
    latitude: 26.1380,
    longitude: 50.5380,
    keywords: ['المستشفى العسكري', 'العسكري', 'قوة دفاع البحرين', 'عسكري الرفاع', 'bdf hospital', 'bdf'],
  },
  {
    id: 'hwg_bahrain_specialist_hospital',
    name: 'مستشفى البحرين التخصصي الجفير',
    nameEn: 'Bahrain Specialist Hospital (BSH)',
    category: 'hospital',
    categoryLabel: 'مستشفى تخصصي خاص',
    parentAreaName: 'الجفير',
    governorate: 'العاصمة',
    latitude: 26.2160,
    longitude: 50.6050,
    keywords: ['مستشفى البحرين التخصصي', 'التخصصي الجفير', 'bahrain specialist hospital', 'bsh'],
  },
  {
    id: 'hwg_royal_bahrain_hospital',
    name: 'مستشفى رويال البحرين السلمانية',
    nameEn: 'Royal Bahrain Hospital (RBH)',
    category: 'hospital',
    categoryLabel: 'مستشفى خاص',
    parentAreaName: 'السلمانية',
    governorate: 'العاصمة',
    latitude: 26.2110,
    longitude: 50.5900,
    keywords: ['رويال البحرين', 'مستشفى رويال البحرين', 'royal bahrain hospital', 'rbh'],
  },
  {
    id: 'hwg_ibn_al_nafees_hospital',
    name: 'مستشفى ابن النفيس الزنج',
    nameEn: 'Ibn Al-Nafees Hospital',
    category: 'hospital',
    categoryLabel: 'مستشفى خاص',
    parentAreaName: 'الزنج',
    governorate: 'العاصمة',
    latitude: 26.2020,
    longitude: 50.5820,
    keywords: ['ابن النفيس', 'مستشفى ابن النفيس', 'ibn al nafees hospital'],
  },
  {
    id: 'hwg_al_hilal_hospital_muharraq',
    name: 'مستشفى الهلال المحرق',
    nameEn: 'Al Hilal Hospital Muharraq',
    category: 'hospital',
    categoryLabel: 'مستشفى خاص',
    parentAreaName: 'المحرق',
    governorate: 'المحرق',
    latitude: 26.2570,
    longitude: 50.6150,
    keywords: ['مستشفى الهلال', 'الهلال المحرق', 'al hilal hospital'],
  },

  // ==========================================
  // 6. الجامعات والصروح الأكاديمية (UNIVERSITIES)
  // ==========================================
  {
    id: 'hwg_uob_sakhir',
    name: 'جامعة البحرين الصخير',
    nameEn: 'University of Bahrain (Sakhir Campus)',
    category: 'university',
    categoryLabel: 'الجامعة الوطنية الكبرى',
    parentAreaName: 'الصخير',
    governorate: 'الجنوبية',
    latitude: 26.0520,
    longitude: 50.5130,
    keywords: ['جامعة البحرين', 'جامعة البحرين الصخير', 'جامعة الصخير', 'uob sakhir', 'uob', 'university of bahrain'],
  },
  {
    id: 'hwg_uob_isa_town',
    name: 'جامعة البحرين مدينة عيسى (كلية الهندسة والعلوم التطبيقية)',
    nameEn: 'University of Bahrain (Isa Town Campus)',
    category: 'university',
    categoryLabel: 'حرم جامعي وتدريبي',
    parentAreaName: 'مدينة عيسى',
    governorate: 'الجنوبية',
    latitude: 26.1730,
    longitude: 50.5510,
    keywords: ['جامعة البحرين مدينة عيسى', 'كلية الهندسة مدينة عيسى', 'uob isa town', 'بوليتكنك'],
  },
  {
    id: 'hwg_bahrain_polytechnic',
    name: 'بوليتكنك البحرين مدينة عيسى',
    nameEn: 'Bahrain Polytechnic',
    category: 'university',
    categoryLabel: 'جامعة تطبيقية',
    parentAreaName: 'مدينة عيسى',
    governorate: 'الجنوبية',
    latitude: 26.1710,
    longitude: 50.5530,
    keywords: ['بوليتكنك', 'بوليتكنك البحرين', 'جامعة بوليتكنك', 'bahrain polytechnic'],
  },
  {
    id: 'hwg_rcsi_medical_university',
    name: 'الكلية الملكية للجراحين في أيرلندا (جامعة البحرين الطبية - البسيتين)',
    nameEn: 'RCSI Medical University of Bahrain',
    category: 'university',
    categoryLabel: 'جامعة طبية دولية',
    parentAreaName: 'البسيتين',
    governorate: 'المحرق',
    latitude: 26.2710,
    longitude: 50.6150,
    keywords: ['rcsi', 'الكلية الملكية للجراحين', 'الجامعة الطبية البسيتين', 'rcsi bahrain'],
  },
  {
    id: 'hwg_agu_university',
    name: 'جامعة الخليج العربي السلمانية',
    nameEn: 'Arabian Gulf University (AGU)',
    category: 'university',
    categoryLabel: 'جامعة خليجية إقليمية',
    parentAreaName: 'السلمانية',
    governorate: 'العاصمة',
    latitude: 26.2100,
    longitude: 50.5890,
    keywords: ['جامعة الخليج العربي', 'جامعة الخليج', 'agu', 'arabian gulf university'],
  },
  {
    id: 'hwg_ahliah_university',
    name: 'الجامعة الأهلية مجمع التأمينات',
    nameEn: 'Ahlia University',
    category: 'university',
    categoryLabel: 'جامعة خاصة',
    parentAreaName: 'الحورة',
    governorate: 'العاصمة',
    latitude: 26.2370,
    longitude: 50.5900,
    keywords: ['الجامعة الاهلية', 'الجامعة الأهلية', 'ahlia university'],
  },

  // ==========================================
  // 7. المعالم والمطارات والمنافذ الحدودية (LANDMARKS & TRANSIT)
  // ==========================================
  {
    id: 'hwg_bahrain_airport',
    name: 'مطار البحرين الدولي',
    nameEn: 'Bahrain International Airport',
    category: 'landmark',
    categoryLabel: 'المطار الدولي الرئيسي',
    parentAreaName: 'المحرق',
    governorate: 'المحرق',
    latitude: 26.2708,
    longitude: 50.6332,
    keywords: ['مطار البحرين', 'المطار', 'مطار البحرين الدولي', 'صالة القادمون', 'صالة المغادرون', 'bahrain international airport', 'bahrain airport', 'bah airport'],
  },
  {
    id: 'hwg_king_fahd_causeway',
    name: 'جسر الملك فهد (المنفذ الحدودي مع السعودية)',
    nameEn: 'King Fahd Causeway',
    category: 'landmark',
    categoryLabel: 'منفذ حدودي بري وجسر دولي',
    parentAreaName: 'الجسرة',
    governorate: 'الشمالية',
    latitude: 26.1770,
    longitude: 50.4610,
    keywords: ['جسر الملك فهد', 'جسر البحرين', 'منفذ الجسر', 'الجسر', 'كوزواي', 'الحدود السعودية', 'الدمام', 'الخبر', 'king fahd causeway', 'causeway'],
  },
  {
    id: 'hwg_bic_f1_circuit',
    name: 'حلبة البحرين الدولية للفورمولا 1 الصخير',
    nameEn: 'Bahrain International Circuit (BIC)',
    category: 'landmark',
    categoryLabel: 'حلبة سباقات وفعاليات كبرى',
    parentAreaName: 'الصخير',
    governorate: 'الجنوبية',
    latitude: 26.0325,
    longitude: 50.5106,
    keywords: ['حلبة البحرين الدولية', 'حلبة البحرين', 'حلبة الصخير', 'الفورمولا 1', 'فورمولا 1', 'حلبة الفورمولا', 'bic', 'bahrain international circuit', 'f1'],
  },
  {
    id: 'hwg_exhibition_world_bahrain',
    name: 'مركز البحرين العالمي للمعارض الجديد الصخير',
    nameEn: 'Exhibition World Bahrain (EWB)',
    category: 'landmark',
    categoryLabel: 'مركز المعارض والمؤتمرات الدولي',
    parentAreaName: 'الصخير',
    governorate: 'الجنوبية',
    latitude: 26.0360,
    longitude: 50.5050,
    keywords: ['مركز المعارض الجديد', 'معارض الصخير', 'مركز البحرين للمعارض', 'معرض الجواهر العربية', 'معرض الخريف', 'exhibition world bahrain', 'ewb'],
  },
  {
    id: 'hwg_bahrain_fort',
    name: 'قلعة البحرين ومتحف الموقع (كرباباد)',
    nameEn: 'Bahrain Fort (Qal\'at al-Bahrain)',
    category: 'landmark',
    categoryLabel: 'موقع تراث عالمي لليونسكو',
    parentAreaName: 'كرباباد',
    governorate: 'العاصمة',
    latitude: 26.2335,
    longitude: 50.5205,
    keywords: ['قلعة البحرين', 'قلعة البرتغال', 'متحف قلعة البحرين', 'كرباباد البحر', 'bahrain fort', 'qalat al bahrain'],
  },
  {
    id: 'hwg_arad_fort',
    name: 'قلعة عراد وممشى قلعة عراد',
    nameEn: 'Arad Fort & Bay Walkway',
    category: 'landmark',
    categoryLabel: 'قلعة أثرية وممشى بحري',
    parentAreaName: 'عراد',
    governorate: 'المحرق',
    latitude: 26.2515,
    longitude: 50.6270,
    keywords: ['قلعة عراد', 'ممشى عراد', 'خليج عراد', 'محمية خليج عراد', 'arad fort'],
  },
  {
    id: 'hwg_national_theatre_museum',
    name: 'متحف البحرين الوطني ومسرح البحرين الوطني',
    nameEn: 'Bahrain National Museum & Theatre',
    category: 'landmark',
    categoryLabel: 'صرح ثقافي ومتحف وطني',
    parentAreaName: 'المنامة',
    governorate: 'العاصمة',
    latitude: 26.2410,
    longitude: 50.5980,
    keywords: ['متحف البحرين الوطني', 'المتحف الوطني', 'مسرح البحرين الوطني', 'متحف البحرين', 'bahrain national museum', 'national theatre'],
  },
  {
    id: 'hwg_adhari_park',
    name: 'منتزه عين عذاري الترفيهي',
    nameEn: 'Adhari Park',
    category: 'landmark',
    categoryLabel: 'مدينة ملاهي ومنتزه ترفيهي',
    parentAreaName: 'عين عذاري',
    governorate: 'العاصمة',
    latitude: 26.2010,
    longitude: 50.5470,
    keywords: ['منتزه عذاري', 'عين عذاري', 'عذاري بارك', 'ملاهي عذاري', 'adhari park'],
  },
  {
    id: 'hwg_tree_of_life',
    name: 'شجرة الحياة الصخير',
    nameEn: 'Tree of Life',
    category: 'landmark',
    categoryLabel: 'معلم طبيعي وسياحي',
    parentAreaName: 'الصخير',
    governorate: 'الجنوبية',
    latitude: 25.9940,
    longitude: 50.5830,
    keywords: ['شجرة الحياة', 'tree of life', 'صحراء الصخير'],
  },
  {
    id: 'hwg_bilaj_al_jazayer',
    name: 'بلاج الجزائر الشاطئ العام والمنتجعات',
    nameEn: 'Bilaj Al Jazayer Beach',
    category: 'landmark',
    categoryLabel: 'واجهة شاطئية وسياحية كبرى',
    parentAreaName: 'الزلاق',
    governorate: 'الجنوبية',
    latitude: 25.9920,
    longitude: 50.4850,
    keywords: ['بلاج الجزائر', 'شاطئ الجزائر', 'بلاج الزلاق', 'bilaj al jazayer', 'bilaj beach'],
  },
  {
    id: 'hwg_durrat_al_bahrain',
    name: 'درة البحرين (المنتجع والجزر السكنية)',
    nameEn: 'Durrat Al Bahrain',
    category: 'landmark',
    categoryLabel: 'مدينة جزر ومنتجعات فاخرة',
    parentAreaName: 'درة البحرين',
    governorate: 'الجنوبية',
    latitude: 25.8340,
    longitude: 50.5960,
    keywords: ['درة البحرين', 'منتجع درة البحرين', 'جزر الدرة', 'بوابة درة البحرين', 'durrat al bahrain', 'durrah'],
  },
  {
    id: 'hwg_amwaj_islands',
    name: 'جزر أمواج (المارينا واللاجون)',
    nameEn: 'Amwaj Islands & The Lagoon',
    category: 'landmark',
    categoryLabel: 'جزر سياحية ومارينا وكافيهات',
    parentAreaName: 'جزر أمواج',
    governorate: 'المحرق',
    latitude: 26.2820,
    longitude: 50.6620,
    keywords: ['جزر أمواج', 'امواج', 'اللاجون', 'لاجون امواج', 'مارينا امواج', 'amwaj islands', 'the lagoon amwaj'],
  },

  // ==========================================
  // 8. المناطق والموانئ الصناعية والتجارية (INDUSTRIAL)
  // ==========================================
  {
    id: 'hwg_khalifa_port',
    name: 'ميناء خليفة بن سلمان الحد الصناعية',
    nameEn: 'Khalifa Bin Salman Port (KBSP)',
    category: 'industrial',
    categoryLabel: 'الميناء البحري الرئيسي والشحن',
    parentAreaName: 'الحد',
    governorate: 'المحرق',
    latitude: 26.2080,
    longitude: 50.7020,
    keywords: ['ميناء خليفة', 'ميناء خليفة بن سلمان', 'ميناء الحد', 'منطقة الحد الصناعية', 'khalifa bin salman port', 'kbsp'],
  },
  {
    id: 'hwg_sitra_industrial',
    name: 'منطقة سترة الصناعية ومحطات الكهرباء',
    nameEn: 'Sitra Industrial Area',
    category: 'industrial',
    categoryLabel: 'منطقة صناعية ومستودعات',
    parentAreaName: 'سترة',
    governorate: 'العاصمة',
    latitude: 26.1550,
    longitude: 50.6200,
    keywords: ['سترة الصناعية', 'صناعية سترة', 'كراجات سترة', 'sitra industrial area'],
  },
  {
    id: 'hwg_salmabad_industrial',
    name: 'منطقة سلماباد الصناعية والكراجات',
    nameEn: 'Salmabad Industrial Area',
    category: 'industrial',
    categoryLabel: 'منطقة كراجات وورش ومستودعات',
    parentAreaName: 'سلماباد',
    governorate: 'الشمالية',
    latitude: 26.1850,
    longitude: 50.5350,
    keywords: ['سلماباد الصناعية', 'صناعية سلماباد', 'كراجات سلماباد', 'ورش سلماباد', 'فحص المرور سلماباد', 'salmabad industrial'],
  },
  {
    id: 'hwg_tubli_industrial',
    name: 'منطقة توبلي الصناعية ومواد البناء',
    nameEn: 'Tubli Industrial & Commercial Area',
    category: 'industrial',
    categoryLabel: 'منطقة ورش ومعارض كبرى',
    parentAreaName: 'توبلي',
    governorate: 'العاصمة',
    latitude: 26.1820,
    longitude: 50.5520,
    keywords: ['توبلي الصناعية', 'صناعية توبلي', 'tubli industrial'],
  },
  {
    id: 'hwg_alba_smelter',
    name: 'شركة ألمنيوم البحرين (ألبا - عسكر)',
    nameEn: 'Aluminium Bahrain (ALBA)',
    category: 'industrial',
    categoryLabel: 'صرح صناعي ومصنع كبرى',
    parentAreaName: 'عسكر',
    governorate: 'الجنوبية',
    latitude: 26.0950,
    longitude: 50.6030,
    keywords: ['البا', 'ألبا', 'شركة البا', 'مصنع البا', 'alba', 'aluminium bahrain'],
  },
  {
    id: 'hwg_bapco_refinery',
    name: 'مصفاة بابكو إنرجيز العوالي / المعامير',
    nameEn: 'Bapco Energies Refinery Awali',
    category: 'industrial',
    categoryLabel: 'مصفاة نفط ومنشآت طاقة',
    parentAreaName: 'العوالي',
    governorate: 'الجنوبية',
    latitude: 26.1200,
    longitude: 50.5900,
    keywords: ['بابكو', 'مصفاة بابكو', 'شركة بابكو', 'عوالي بابكو', 'bapco refinery', 'bapco'],
  },

  // ==========================================
  // 9. الأحياء والإسكانات والدوارات الشهيرة (RESIDENTIAL & BLOCKS)
  // ==========================================
  {
    id: 'hwg_hamad_town_roundabouts',
    name: 'مدينة حمد (الدوارات من 1 إلى 22)',
    nameEn: 'Hamad Town (Roundabouts 1 - 22)',
    category: 'residential',
    categoryLabel: 'مدينة سكنية كبرى مقسمة بدوارات',
    parentAreaName: 'مدينة حمد',
    governorate: 'الشمالية',
    latitude: 26.1150,
    longitude: 50.5069,
    keywords: [
      'مدينة حمد', 'مدينه حمد',
      'دوار 1', 'دوار 2', 'دوار 3', 'دوار 4', 'دوار 5',
      'دوار 6', 'دوار 7', 'دوار 8', 'دوار 9', 'دوار 10',
      'دوار 11', 'دوار 12', 'دوار 13', 'دوار 14', 'دوار 15',
      'دوار 16', 'دوار 17', 'دوار 18', 'دوار 19', 'دوار 20',
      'دوار 21', 'دوار 22',
      'hamad town', 'hamad town roundabouts'
    ],
  },
  {
    id: 'hwg_lawzi_housing',
    name: 'إسكان اللوزي مدينة حمد',
    nameEn: 'Al Lawzi Housing Project',
    category: 'residential',
    categoryLabel: 'مشروع سكني حديث',
    parentAreaName: 'اللوزي',
    governorate: 'الشمالية',
    latitude: 26.1550,
    longitude: 50.4850,
    keywords: ['اللوزي', 'إسكان اللوزي', 'اسكان اللوزي', 'بحيرة اللوزي', 'lawzi housing', 'al lawzi'],
  },
  {
    id: 'hwg_ramli_housing',
    name: 'إسكان الرملي وسلماباد الجديدة',
    nameEn: 'Al Ramli Housing Project',
    category: 'residential',
    categoryLabel: 'مشروع إسكان سكني حديث',
    parentAreaName: 'سلماباد',
    governorate: 'الشمالية',
    latitude: 26.1790,
    longitude: 50.5360,
    keywords: ['إسكان الرملي', 'اسكان الرملي', 'ضاحية الرملي', 'ramli housing'],
  },
  {
    id: 'hwg_salman_city',
    name: 'مدينة سلمان (الجزر الساحلية الشمالية)',
    nameEn: 'Salman City (Northern Town)',
    category: 'residential',
    categoryLabel: 'مدينة ساحلية سكنية متكاملة',
    parentAreaName: 'مدينة سلمان',
    governorate: 'الشمالية',
    latitude: 26.2410,
    longitude: 50.4560,
    keywords: ['مدينة سلمان', 'المدينة الشمالية', 'إسكان مدينة سلمان', 'salman city', 'madinat salman', 'northern town'],
  },
  {
    id: 'hwg_wadi_al_sail',
    name: 'وادي السيل الرفاع',
    nameEn: 'Wadi Al Sail Riffa',
    category: 'residential',
    categoryLabel: 'حي سكني ومجمع تجاري',
    parentAreaName: 'الرفاع الغربي',
    governorate: 'الجنوبية',
    latitude: 26.1410,
    longitude: 50.5250,
    keywords: ['وادي السيل', 'مجمع وادي السيل', 'سينما وادي السيل', 'اسكان وادي السيل', 'wadi al sail'],
  },
  {
    id: 'hwg_hunainiya_valley',
    name: 'وادي الحنينية ومتنزه الحنينية الرفاع',
    nameEn: 'Hunainiya Valley Riffa',
    category: 'residential',
    categoryLabel: 'وادي تراثي ومنتزه عائلي',
    parentAreaName: 'الرفاع الشرقي',
    governorate: 'الجنوبية',
    latitude: 26.1180,
    longitude: 50.5590,
    keywords: ['الحنينية', 'وادي الحنينية', 'عين الحنينية', 'قلعة الشيخ سلمان الحنينية', 'hunainiya'],
  },
  {
    id: 'hwg_sayah_busaiteen',
    name: 'الساية البسيتين',
    nameEn: 'Al Sayah Busaiteen',
    category: 'residential',
    categoryLabel: 'واجهة سكنية وبحرية حديثة',
    parentAreaName: 'البسيتين',
    governorate: 'المحرق',
    latitude: 26.2750,
    longitude: 50.5980,
    keywords: ['الساية', 'السايه', 'إسكان الساية', 'شاطئ الساية', 'al sayah', 'sayah busaiteen'],
  },
];

/**
 * دالة ذكية للبحث الفوري عن أي معلم أو مجمع أو سوق أو محل في النص
 * مستوحاة من محرك بحث HERE WeGo فائق السرعة
 */
export function findHereWeGoPlaceInText(text: string): HereWeGoPlace | undefined {
  if (!text) return undefined;
  const norm = normalizeArabicText(text);

  // 1. فحص الكلمات المفتاحية الأكثر تطابقاً
  for (const place of HERE_WE_GO_BAHRAIN_PLACES) {
    for (const kw of place.keywords) {
      const normKw = normalizeArabicText(kw);
      if (norm.includes(normKw)) {
        return place;
      }
    }
  }

  // 2. فحص اسم المكان الرئيسي
  for (const place of HERE_WE_GO_BAHRAIN_PLACES) {
    const normName = normalizeArabicText(place.name);
    if (norm.includes(normName)) {
      return place;
    }
  }

  return undefined;
}

/**
 * دالة بحث متقدمة مع ترجيح النتائج وتصنيفها للسائق والذكاء الاصطناعي
 */
export function searchHereWeGoPlaces(query: string, limit: number = 8): HereWeGoPlace[] {
  if (!query || query.trim().length === 0) {
    return HERE_WE_GO_BAHRAIN_PLACES.slice(0, limit);
  }

  const normQuery = normalizeArabicText(query.trim());
  const words = normQuery.split(/\s+/).filter(Boolean);

  const scored = HERE_WE_GO_BAHRAIN_PLACES.map((place) => {
    let score = 0;
    const normName = normalizeArabicText(place.name);
    const normArea = normalizeArabicText(place.parentAreaName);
    const normGov = normalizeArabicText(place.governorate);

    if (normName === normQuery) score += 100;
    else if (normName.startsWith(normQuery)) score += 60;
    else if (normName.includes(normQuery)) score += 40;

    if (normArea === normQuery) score += 50;
    else if (normArea.includes(normQuery)) score += 25;

    if (normGov.includes(normQuery)) score += 15;

    for (const kw of place.keywords) {
      const normKw = normalizeArabicText(kw);
      if (normKw === normQuery) {
        score += 80;
        break;
      } else if (normKw.includes(normQuery)) {
        score += 30;
        break;
      }
    }

    // Word partial matches
    for (const word of words) {
      if (word.length >= 2 && normName.includes(word)) score += 10;
    }

    return { place, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.place);
}

/**
 * مطابقة سريعة لأي اسم مدخل وتحويله إلى موقع جغرافي موحد
 */
export function resolveHereWeGoLocation(nameOrKeyword: string): {
  officialArea: string;
  matchedPlace?: HereWeGoPlace;
  latitude?: number;
  longitude?: number;
} {
  if (!nameOrKeyword) return { officialArea: '' };

  const matched = findHereWeGoPlaceInText(nameOrKeyword);
  if (matched) {
    return {
      officialArea: matched.parentAreaName,
      matchedPlace: matched,
      latitude: matched.latitude,
      longitude: matched.longitude,
    };
  }

  return { officialArea: nameOrKeyword.trim() };
}
