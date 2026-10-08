import { AreaLocation } from '../types';
import { normalizeArabicText } from './bahrainAreas';

export interface BahrainLandmark {
  id: string;
  name: string;
  nameEn: string;
  parentAreaName: string; // المنطقة التابعة لها (مثل المنامة، السيف، السنابس)
  governorate: string;
  latitude: number;
  longitude: number;
  keywords: string[]; // الصيغ والكلمات المفتاحية التي يكتبها المعلنون
}

/**
 * قاعدة بيانات شاملة لمجمعات ومولات ومعالم البحرين الشهيرة
 * مع إحداثياتها الدقيقة وربطها بالمناطق لتحديد موقع الكابتن ونطاق التغطية
 */
export const BAHRAIN_LANDMARKS: BahrainLandmark[] = [
  // 1. مودا مول (مركز البحرين التجاري العالمي - المنامة)
  {
    id: 'moda_mall',
    name: 'مودا مول',
    nameEn: 'Moda Mall',
    parentAreaName: 'المنامة',
    governorate: 'العاصمة',
    latitude: 26.2370,
    longitude: 50.5820,
    keywords: [
      'مودامول',
      'مودا مول',
      'مودا',
      'مجمع مودا',
      'مركز البحرين التجاري العالمي',
      'برج التجارة العالمي',
      'شيراتون',
      'فندق الشيراتون',
      'moda mall',
      'modamall',
      'bwtc',
    ],
  },

  // 2. مجمع السيف (ضاحية السيف)
  {
    id: 'seef_mall',
    name: 'مجمع السيف',
    nameEn: 'Seef Mall',
    parentAreaName: 'السيف',
    governorate: 'العاصمة',
    latitude: 26.2410,
    longitude: 50.5360,
    keywords: [
      'السيف مول',
      'سيف مول',
      'مجمع السيف',
      'سيف المنامة',
      'مول السيف',
      'seef mall',
      'seefmall',
    ],
  },

  // 3. سيتي سنتر البحرين (ضاحية السيف)
  {
    id: 'city_centre',
    name: 'سيتي سنتر البحرين',
    nameEn: 'City Centre Bahrain',
    parentAreaName: 'السيف',
    governorate: 'العاصمة',
    latitude: 26.2345,
    longitude: 50.5510,
    keywords: [
      'سيتي سنتر',
      'السيتي سنتر',
      'سيتي سنتر البحرين',
      'مجمع سيتي سنتر',
      'سيتي سنتر مول',
      'ستي سنتر',
      'الستي سنتر',
      'city centre',
      'city center',
      'citycentre',
      'bahrain city centre',
    ],
  },

  // 4. الأفنيوز البحرين (كورنيش الملك فيصل - المنامة)
  {
    id: 'the_avenues',
    name: 'الأفنيوز البحرين',
    nameEn: 'The Avenues Bahrain',
    parentAreaName: 'المنامة',
    governorate: 'العاصمة',
    latitude: 26.2425,
    longitude: 50.5780,
    keywords: [
      'الافنيوز',
      'الأفنيوز',
      'افنيوز',
      'ذا افنيوز',
      'ذا أفنيوز',
      'مجمع الافنيوز',
      'avenues',
      'the avenues',
    ],
  },

  // 5. مجمع الدانة (السنابس)
  {
    id: 'dana_mall',
    name: 'مجمع الدانة',
    nameEn: 'Dana Mall',
    parentAreaName: 'السنابس',
    governorate: 'العاصمة',
    latitude: 26.2300,
    longitude: 50.5560,
    keywords: [
      'مجمع الدانة',
      'مجمع الدانه',
      'الدانة مول',
      'الدانه مول',
      'دانا مول',
      'dana mall',
      'danamall',
    ],
  },

  // 6. مجمع البحرين / جيان (السنابس)
  {
    id: 'bahrain_mall',
    name: 'مجمع البحرين',
    nameEn: 'Bahrain Mall',
    parentAreaName: 'السنابس',
    governorate: 'العاصمة',
    latitude: 26.2280,
    longitude: 50.5510,
    keywords: [
      'مجمع البحرين',
      'جيان',
      'جيان السنابس',
      'لولو السنابس',
      'bahrain mall',
    ],
  },

  // 7. مجمع العالي (ضاحية السيف)
  {
    id: 'al_aali_mall',
    name: 'مجمع العالي',
    nameEn: 'Al Aali Mall',
    parentAreaName: 'السيف',
    governorate: 'العاصمة',
    latitude: 26.2400,
    longitude: 50.5390,
    keywords: [
      'مجمع العالي',
      'العالي مول',
      'العالي',
      'al aali mall',
      'aali mall',
    ],
  },

  // 8. مجمع مارينا مول (المنامة / النعيم)
  {
    id: 'marina_mall',
    name: 'مارينا مول',
    nameEn: 'Marina Mall',
    parentAreaName: 'المنامة',
    governorate: 'العاصمة',
    latitude: 26.2310,
    longitude: 50.5720,
    keywords: [
      'مارينا مول',
      'مجمع مارينا',
      'مارينا',
      'marina mall',
    ],
  },

  // 9. مجمع الواحة - الجفير
  {
    id: 'oasis_juffair',
    name: 'الواحة مول الجفير',
    nameEn: 'Oasis Mall Juffair',
    parentAreaName: 'الجفير',
    governorate: 'العاصمة',
    latitude: 26.2160,
    longitude: 50.6020,
    keywords: [
      'واحة الجفير',
      'الواحة الجفير',
      'مجمع الواحة الجفير',
      'الواحة مول الجفير',
      'oasis juffair',
    ],
  },

  // 10. مجمع الواحة - المحرق
  {
    id: 'oasis_muharraq',
    name: 'الواحة مول المحرق',
    nameEn: 'Oasis Mall Muharraq',
    parentAreaName: 'المحرق',
    governorate: 'المحرق',
    latitude: 26.2570,
    longitude: 50.6120,
    keywords: [
      'واحة المحرق',
      'الواحة المحرق',
      'مجمع الواحة المحرق',
      'الواحة مول المحرق',
      'oasis muharraq',
    ],
  },

  // 11. مجمع الواحة - الرفاع
  {
    id: 'oasis_riffa',
    name: 'الواحة مول الرفاع',
    nameEn: 'Oasis Mall Riffa',
    parentAreaName: 'الرفاع الشرقي',
    governorate: 'الجنوبية',
    latitude: 26.1260,
    longitude: 50.5620,
    keywords: [
      'واحة الرفاع',
      'الواحة الرفاع',
      'مجمع الواحة الرفاع',
      'الواحة مول الرفاع',
      'oasis riffa',
    ],
  },

  // 12. مجمع الإنماء (الرفاع الشرقي)
  {
    id: 'enma_mall',
    name: 'مجمع الإنماء',
    nameEn: 'Enma Mall',
    parentAreaName: 'الرفاع الشرقي',
    governorate: 'الجنوبية',
    latitude: 26.1250,
    longitude: 50.5750,
    keywords: [
      'مجمع الانماء',
      'مجمع الإنماء',
      'انماء مول',
      'إنماء مول',
      'الانماء مول',
      'الإنماء مول',
      'enma mall',
      'al enma',
    ],
  },

  // 13. مجمع رملي (عالي / سلماباد)
  {
    id: 'ramli_mall',
    name: 'مجمع رملي',
    nameEn: 'Ramli Mall',
    parentAreaName: 'عالي',
    governorate: 'الجنوبية',
    latitude: 26.1600,
    longitude: 50.5300,
    keywords: [
      'مجمع رملي',
      'مجمع الرملي',
      'رملي مول',
      'الرملي مول',
      'لولو عالي',
      'ramli mall',
    ],
  },

  // 14. مجمع الليوان (الهملة)
  {
    id: 'liwan_mall',
    name: 'مجمع الليوان',
    nameEn: 'Al Liwan Hamala',
    parentAreaName: 'الهملة',
    governorate: 'الشمالية',
    latitude: 26.1750,
    longitude: 50.4850,
    keywords: [
      'مجمع الليوان',
      'الليوان',
      'ليوان الهملة',
      'ليوان',
      'al liwan',
      'liwan mall',
    ],
  },

  // 15. مجمع أتريوم (الجنبية / سار)
  {
    id: 'atrium_mall',
    name: 'مجمع الأتريوم',
    nameEn: 'Atrium Mall',
    parentAreaName: 'الجنبية',
    governorate: 'الشمالية',
    latitude: 26.2080,
    longitude: 50.4880,
    keywords: [
      'مجمع اتريوم',
      'مجمع الأتريوم',
      'اتريوم مول',
      'الأتريوم مول',
      'اتريوم الجنبية',
      'atrium mall',
      'atrium',
    ],
  },

  // 16. مجمع دلمونيا (جزيرة دلمونيا / المحرق)
  {
    id: 'mall_of_dilmunia',
    name: 'مول دلمونيا',
    nameEn: 'Mall of Dilmunia',
    parentAreaName: 'ديار المحرق',
    governorate: 'المحرق',
    latitude: 26.2950,
    longitude: 50.6650,
    keywords: [
      'مجمع دلمونيا',
      'مول دلمونيا',
      'دلمونيا مول',
      'جزيرة دلمونيا',
      'دلمونيا',
      'dilmunia mall',
      'mall of dilmunia',
    ],
  },

  // 17. مراسي جاليريا (ديار المحرق)
  {
    id: 'marassi_galleria',
    name: 'مراسي جاليريا',
    nameEn: 'Marassi Galleria',
    parentAreaName: 'ديار المحرق',
    governorate: 'المحرق',
    latitude: 26.2900,
    longitude: 50.6400,
    keywords: [
      'مراسي جاليريا',
      'مراسي البحرين',
      'مراسي مول',
      'مجمع مراسي',
      'marassi galleria',
      'marassi',
    ],
  },

  // 18. لاغون أمواج (جزر أمواج)
  {
    id: 'the_lagoon_amwaj',
    name: 'لاغون أمواج',
    nameEn: 'The Lagoon Amwaj',
    parentAreaName: 'جزر أمواج',
    governorate: 'المحرق',
    latitude: 26.2840,
    longitude: 50.6640,
    keywords: [
      'لاغون أمواج',
      'لاغون امواج',
      'اللاغون',
      'ذا لاجون',
      'لاجون أمواج',
      'the lagoon',
      'lagoon amwaj',
    ],
  },

  // 19. سوق واقف (مدينة حمد / المالكية)
  {
    id: 'souq_waqif_bh',
    name: 'سوق واقف',
    nameEn: 'Souq Waqif',
    parentAreaName: 'مدينة حمد',
    governorate: 'الشمالية',
    latitude: 26.1220,
    longitude: 50.5050,
    keywords: [
      'سوق واقف',
      'سوق واقف البحرين',
      'سوق واقف مدينة حمد',
      'دوار 1 سوق واقف',
      'souq waqif',
    ],
  },

  // 20. سوق التنين / دراغون سيتي (ديار المحرق)
  {
    id: 'dragon_city',
    name: 'سوق التنين',
    nameEn: 'Dragon City',
    parentAreaName: 'ديار المحرق',
    governorate: 'المحرق',
    latitude: 26.2880,
    longitude: 50.6280,
    keywords: [
      'سوق التنين',
      'التنين',
      'دراغون سيتي',
      'دراجون سيتي',
      'التنين ديار المحرق',
      'dragon city',
    ],
  },

  // 21. باب البحرين وسوق المنامة القديم
  {
    id: 'bab_al_bahrain',
    name: 'باب البحرين / سوق المنامة',
    nameEn: 'Bab Al Bahrain',
    parentAreaName: 'المنامة',
    governorate: 'العاصمة',
    latitude: 26.2340,
    longitude: 50.5750,
    keywords: [
      'باب البحرين',
      'سوق المنامة',
      'سوق المنامه',
      'السوق القديم المنامة',
      'bab al bahrain',
    ],
  },

  // 22. سوق المحرق والقيصرية
  {
    id: 'souq_muharraq',
    name: 'سوق المحرق / القيصرية',
    nameEn: 'Souq Al Qaisariya',
    parentAreaName: 'المحرق',
    governorate: 'المحرق',
    latitude: 26.2550,
    longitude: 50.6120,
    keywords: [
      'سوق المحرق',
      'سوق القيصرية',
      'قيصرية المحرق',
      'سوق القيصريه',
    ],
  },

  // 23. ووتر غاردن سيتي (ضاحية السيف)
  {
    id: 'water_garden_city',
    name: 'ووتر جاردن سيتي',
    nameEn: 'Water Garden City',
    parentAreaName: 'السيف',
    governorate: 'العاصمة',
    latitude: 26.2450,
    longitude: 50.5440,
    keywords: [
      'ووتر جاردن سيتي',
      'ووتر غاردن سيتي',
      'واتر جاردن',
      'واتر جاردن سيتي',
      'water garden city',
    ],
  },

  // 24. خليج البحرين / البحرين باي
  {
    id: 'bahrain_bay',
    name: 'خليج البحرين',
    nameEn: 'Bahrain Bay',
    parentAreaName: 'المنامة',
    governorate: 'العاصمة',
    latitude: 26.2480,
    longitude: 50.5750,
    keywords: [
      'خليج البحرين',
      'البحرين باي',
      'فندق الفورسيزونز',
      'فورسيزونز البحرين',
      'bahrain bay',
    ],
  },

  // 25. مطار البحرين الدولي (المحرق)
  {
    id: 'bahrain_airport',
    name: 'مطار البحرين الدولي',
    nameEn: 'Bahrain International Airport',
    parentAreaName: 'المحرق',
    governorate: 'المحرق',
    latitude: 26.2700,
    longitude: 50.6330,
    keywords: [
      'مطار البحرين',
      'مطار البحرين الدولي',
      'المطار',
      'مطار المحرق',
      'bahrain airport',
      'bahrain international airport',
    ],
  },

  // 26. مجمع السلمانية الطبي (السلمانية)
  {
    id: 'salmaniya_complex',
    name: 'مجمع السلمانية الطبي',
    nameEn: 'Salmaniya Medical Complex',
    parentAreaName: 'السلمانية',
    governorate: 'العاصمة',
    latitude: 26.2120,
    longitude: 50.5840,
    keywords: [
      'مستشفى السلمانية',
      'السلمانية الطبي',
      'مجمع السلمانية الطبي',
      'مركز السلمانية',
      'salmaniya hospital',
    ],
  },

  // 27. مستشفى الملك حمد الجامعي (البسيتين / المحرق)
  {
    id: 'king_hamad_hospital',
    name: 'مستشفى الملك حمد الجامعي',
    nameEn: 'King Hamad University Hospital',
    parentAreaName: 'البسيتين',
    governorate: 'المحرق',
    latitude: 26.2730,
    longitude: 50.6080,
    keywords: [
      'مستشفى الملك حمد',
      'الملك حمد الجامعي',
      'مستشفى الملك حمد الجامعي',
      'مستشفى البسيتين',
      'khuh',
    ],
  },

  // 28. المستشفى العسكري (الرفاع الغربي)
  {
    id: 'bdf_hospital',
    name: 'المستشفى العسكري (قوة الدفاع)',
    nameEn: 'BDF Hospital',
    parentAreaName: 'الرفاع الغربي',
    governorate: 'الجنوبية',
    latitude: 26.1360,
    longitude: 50.5480,
    keywords: [
      'المستشفى العسكري',
      'العسكري',
      'مستشفى العسكري',
      'قوة دفاع البحرين',
      'مستشفى قوة الدفاع',
      'bdf hospital',
      'bdf',
    ],
  },

  // 29. حلبة البحرين الدولية (الصخير)
  {
    id: 'bahrain_intl_circuit',
    name: 'حلبة البحرين الدولية',
    nameEn: 'Bahrain International Circuit',
    parentAreaName: 'الزلاق',
    governorate: 'الجنوبية',
    latitude: 26.0320,
    longitude: 50.5100,
    keywords: [
      'حلبة البحرين الدولية',
      'حلبة البحرين',
      'حلبة الصخير',
      'الصخير',
      'صخير',
      'الفورمولا',
      'فورمولا 1',
      'bic',
    ],
  },

  // 30. جامعة البحرين - الصخير
  {
    id: 'uob_sakhir',
    name: 'جامعة البحرين (الصخير)',
    nameEn: 'University of Bahrain Sakhir',
    parentAreaName: 'الزلاق',
    governorate: 'الجنوبية',
    latitude: 26.0520,
    longitude: 50.5120,
    keywords: [
      'جامعة البحرين الصخير',
      'جامعة البحرين',
      'جامعه البحرين',
      'يو او بي',
      'uob',
    ],
  },

  // 31. جامعة البحرين - مدينة عيسى / بوليتكنك البحرين
  {
    id: 'polytechnic_isa_town',
    name: 'جامعة بوليتكنك / مدينة عيسى',
    nameEn: 'Bahrain Polytechnic',
    parentAreaName: 'مدينة عيسى',
    governorate: 'الجنوبية',
    latitude: 26.1700,
    longitude: 50.5450,
    keywords: [
      'بوليتكنك',
      'بوليتكنك البحرين',
      'جامعة البحرين مدينة عيسى',
    ],
  },

  // 32. درة البحرين
  {
    id: 'durrat_al_bahrain_lm',
    name: 'منتجع درة البحرين',
    nameEn: 'Durrat Al Bahrain Resort',
    parentAreaName: 'درة البحرين',
    governorate: 'الجنوبية',
    latitude: 25.8350,
    longitude: 50.5900,
    keywords: [
      'درة البحرين',
      'الدرة',
      'منتجع الدرة',
      'durrat al bahrain',
    ],
  },

  // 33. مجمع مرسليا / مرسيليا (باربار / جنوسان)
  {
    id: 'marseille_mall',
    name: 'مجمع مرسيليا',
    nameEn: 'Marseille Mall',
    parentAreaName: 'باربار',
    governorate: 'الشمالية',
    latitude: 26.2200,
    longitude: 50.4900,
    keywords: [
      'مجمع مرسيليا',
      'مجمع مرسليا',
      'مرسيليا مول',
    ],
  },

  // 34. مجمع الراية (الجفير)
  {
    id: 'al_raya_mall',
    name: 'مجمع الراية الجفير',
    nameEn: 'Al Raya Mall',
    parentAreaName: 'الجفير',
    governorate: 'العاصمة',
    latitude: 26.2130,
    longitude: 50.6010,
    keywords: [
      'مجمع الراية',
      'الراية مول',
      'الراية الجفير',
      'al raya mall',
    ],
  },
];

/**
 * يبحث عن المعلم أو المول في النص المُدخل
 */
export function findLandmarkInText(text: string): BahrainLandmark | undefined {
  if (!text) return undefined;
  const norm = normalizeArabicText(text);

  // الفحص الأولي: المطابقة المباشرة مع الكلمات المفتاحية
  for (const landmark of BAHRAIN_LANDMARKS) {
    for (const kw of landmark.keywords) {
      const normKw = normalizeArabicText(kw);
      if (norm.includes(normKw)) {
        return landmark;
      }
    }
  }

  return undefined;
}

/**
 * يبحث عن المعلم بالاسم الدقيق أو التقريبي
 */
export function findLandmarkByName(name: string): BahrainLandmark | undefined {
  if (!name) return undefined;
  const norm = normalizeArabicText(name);

  return BAHRAIN_LANDMARKS.find((lm) => {
    const lmNorm = normalizeArabicText(lm.name);
    if (lmNorm === norm || lmNorm.includes(norm) || norm.includes(lmNorm)) return true;
    return lm.keywords.some((kw) => {
      const kwNorm = normalizeArabicText(kw);
      return kwNorm === norm || kwNorm.includes(norm) || norm.includes(kwNorm);
    });
  });
}
