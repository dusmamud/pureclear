import type { Locale } from "../lib/i18n";

export interface FormatFaq {
  q: string;
  a: string;
}

export interface FormatInfo {
  slug: string;
  name: string;
  extensions: string[];
  /** SVG path data for the format's card icon (Phosphor Regular, 256 viewBox). */
  icon: string;
  tagline: Record<Locale, string>;
  seoTitle: Record<Locale, string>;
  seoDescription: Record<Locale, string>;
  intro: Record<Locale, string>;
  removed: Record<Locale, string[]>;
  faqs: Record<Locale, FormatFaq[]>;
}

export const FORMATS: FormatInfo[] = [
  {
    slug: "jpg",
    name: "JPG",
    extensions: ["jpg", "jpeg"],
    icon: "M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V158.75l-26.07-26.06a16,16,0,0,0-22.63,0l-20,20-44-44a16,16,0,0,0-22.62,0L40,149.37V56ZM40,172l52-52,80,80H40Zm176,28H194.63l-36-36,20-20L216,181.38V200ZM144,100a12,12,0,1,1,12,12A12,12,0,0,1,144,100Z",
    tagline: {
      en: "The everyday photo",
      hi: "Rozmarra ki photo",
      as: "দৈনন্দিন ফটো",
    },
    seoTitle: {
      en: "Remove EXIF Metadata from JPG — Free & Private",
      hi: "JPG se EXIF Metadata Hatayein — Free aur Private",
      as: "JPG ৰ পৰা EXIF মেটাডাটা আঁতৰাওক — বিনামূলীয়া",
    },
    seoDescription: {
      en: "Strip EXIF, GPS location, IPTC and XMP metadata from JPG/JPEG photos online. Free, lossless, 100% in-browser — your files never leave your device.",
      hi: "JPG/JPEG photo se EXIF, GPS location, IPTC aur XMP metadata online hatayein. Free, lossless, 100% browser me — file device se bahar nahi jaati.",
      as: "JPG/JPEG ফটোৰ পৰা EXIF, GPS অৱস্থান, IPTC আৰু XMP মেটাডাটা অনলাইনত আঁতৰাওক। বিনামূলীয়া, লচলেছ, সম্পূৰ্ণ ব্ৰাউজাৰত।",
    },
    intro: {
      en: "JPEG is the world's most common photo format — and one of the leakiest. Every shot from a camera or phone can carry EXIF data (camera model, exposure, exact GPS coordinates), IPTC captions and keywords, XMP packets, even a plain-text JPEG comment. Share a JPEG straight from your camera and you may be sharing exactly where and when it was taken.",
      hi: "JPEG duniya ka sabse common photo format hai — aur sabse zyada leak karne wala bhi. Camera ya phone ki har photo me EXIF data (camera model, exposure, exact GPS coordinates), IPTC captions aur keywords, XMP packets, yahan tak ki plain-text JPEG comment ho sakta hai. Camera se seedha share ki hui JPEG bata sakti hai aap kahan the, kab the.",
      as: "JPEG বিশ্বৰ আটাইতকৈ সাধাৰণ ফটো ফৰমেট — আৰু আটাইতকৈ বেছি তথ্য প্ৰকাশ কৰা। কেমেৰা বা ফোনৰ প্ৰতিটো ফটোতে EXIF ডাটা (কেমেৰা মডেল, এক্সপ’জাৰ, সঠিক GPS স্থানাংক), IPTC কেপচন আৰু XMP পেকেট থাকিব পাৰে।",
    },
    removed: {
      en: [
        "EXIF camera data — model, lens, exposure settings",
        "GPS location coordinates",
        "IPTC captions, keywords and copyright",
        "XMP metadata packets",
        "Embedded thumbnail preview",
        "JPEG COM text comments",
      ],
      hi: [
        "EXIF camera data — model, lens, exposure settings",
        "GPS location coordinates",
        "IPTC captions, keywords aur copyright",
        "XMP metadata packets",
        "Embedded thumbnail preview",
        "JPEG COM text comments",
      ],
      as: [
        "EXIF কেমেৰা ডাটা — মডেল, লেন্স, এক্সপ’জাৰ",
        "GPS স্থানাংক",
        "IPTC কেপচন, কীৱৰ্ড আৰু কপিৰাইট",
        "XMP মেটাডাটা পেকেট",
        "এমবেডেড থাম্বনেইল প্ৰিভিউ",
        "JPEG COM টেক্সট মন্তব্য",
      ],
    },
    faqs: {
      en: [
        {
          q: "Will stripping metadata reduce my JPEG's quality?",
          a: "No. PureClear removes only metadata segments (APPn markers) — the image pixels are never re-encoded. The photo is byte-identical, just smaller and private.",
        },
        {
          q: "Does it remove the thumbnail preview inside the JPEG?",
          a: "Yes. JPEGs often embed a small EXIF thumbnail that can reveal the original photo even after cropping. PureClear strips it along with everything else.",
        },
        {
          q: "What about the date shown in my gallery app?",
          a: "That date is read from EXIF. After stripping, apps fall back to the file date. The photo itself is unchanged.",
        },
      ],
      hi: [
        {
          q: "Kya metadata hatane se JPEG ki quality kam hogi?",
          a: "Nahi. PureClear sirf metadata segments (APPn markers) hatata hai — image pixels kabhi re-encode nahi hote. Photo byte-identical rehti hai, bas chhoti aur private.",
        },
        {
          q: "Kya JPEG ke andar ka thumbnail preview bhi hatega?",
          a: "Haan. JPEG me aksar ek chhota EXIF thumbnail hota hai jo crop ke baad bhi original photo dikha sakta hai. PureClear use bhi hata deta hai.",
        },
        {
          q: "Gallery app me dikhne wali date ka kya hoga?",
          a: "Woh date EXIF se padhi jaati hai. Strip ke baad apps file date dikhate hain. Photo me koi badlav nahi hota.",
        },
      ],
      as: [
        {
          q: "মেটাডাটা আঁতৰালে মোৰ JPEG ৰ মান কমিব নেকি?",
          a: "নকমে। PureClear-এ কেৱল মেটাডাটা অংশ (APPn মাৰ্কাৰ) আঁতৰায় — ছবিৰ পিক্সেল পুনৰ এনক’ড নহয়। ফটো একেই থাকে, মাথোঁ সৰু আৰু ব্যক্তিগত।",
        },
        {
          q: "JPEG ৰ ভিতৰৰ থাম্বনেইল প্ৰিভিউ আঁতৰিব নেকি?",
          a: "হয়। JPEG ত সঘনাই সৰু EXIF থাম্বনেইল থাকে। PureClear-এ সেয়াও আঁতৰাই দিয়ে।",
        },
        {
          q: "গেলাৰী এপত দেখা তাৰিখৰ কি হ’ব?",
          a: "সেই তাৰিখ EXIF ৰ পৰা পঢ়া হয়। আঁতৰোৱাৰ পিছত এপে ফাইলৰ তাৰিখ দেখুৱায়।",
        },
      ],
    },
  },
  {
    slug: "png",
    name: "PNG",
    extensions: ["png"],
    icon: "M216,40H72A16,16,0,0,0,56,56V72H40A16,16,0,0,0,24,88V200a16,16,0,0,0,16,16H184a16,16,0,0,0,16-16V184h16a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM72,56H216v62.75l-10.07-10.06a16,16,0,0,0-22.63,0l-20,20-44-44a16,16,0,0,0-22.62,0L72,109.37ZM184,200H40V88H56v80a16,16,0,0,0,16,16H184Zm32-32H72V132l36-36,49.66,49.66a8,8,0,0,0,11.31,0L194.63,120,216,141.38V168ZM160,84a12,12,0,1,1,12,12A12,12,0,0,1,160,84Z",
    tagline: {
      en: "Screenshots and graphics",
      hi: "Screenshots aur graphics",
      as: "স্ক্ৰীণশ্বট আৰু গ্ৰাফিক্স",
    },
    seoTitle: {
      en: "Remove Metadata from PNG — Free & Private",
      hi: "PNG se Metadata Hatayein — Free aur Private",
      as: "PNG ৰ পৰা মেটাডাটা আঁতৰাওক — বিনামূলীয়া",
    },
    seoDescription: {
      en: "Strip text chunks, XMP and EXIF metadata from PNG images online. Free, lossless, 100% in-browser — screenshots and graphics stay pixel-perfect.",
      hi: "PNG image se text chunks, XMP aur EXIF metadata online hatayein. Free, lossless, 100% browser me — screenshot bilkul waisa hi rehta hai.",
      as: "PNG ছবিৰ পৰা টেক্সট চাংক, XMP আৰু EXIF মেটাডাটা অনলাইনত আঁতৰাওক। বিনামূলীয়া, লচলেছ, সম্পূৰ্ণ ব্ৰাউজাৰত।",
    },
    intro: {
      en: "PNGs look innocent, but they carry metadata in text chunks — tEXt, zTXt and multilingual iTXt — plus XMP packets and even a full EXIF profile in the eXIf chunk. Screenshots and exported graphics routinely contain software names, timestamps and editing history you'd never expect to be sharing.",
      hi: "PNG masoom lagta hai, lekin isme text chunks (tEXt, zTXt, iTXt), XMP packets aur eXIf chunk me poora EXIF profile hota hai. Screenshot aur exported graphics me aksar software ka naam, timestamps aur editing history hoti hai — jise aap share karna nahi chahenge.",
      as: "PNG নিৰীহ যেন লাগে, কিন্তু ইয়াত টেক্সট চাংক (tEXt, zTXt, iTXt), XMP পেকেট, আনকি eXIf চাংকত সম্পূৰ্ণ EXIF প্ৰ’ফাইল থাকে। স্ক্ৰীণশ্বটত সঘনাই ছফ্টৱেৰৰ নাম আৰু সময় থাকে।",
    },
    removed: {
      en: [
        "tEXt / zTXt / iTXt text chunks",
        "Software name and timestamps",
        "XMP metadata packets",
        "eXIf chunk (full EXIF profile)",
        "Creation time identifiers",
        "Editing history tags",
      ],
      hi: [
        "tEXt / zTXt / iTXt text chunks",
        "Software ka naam aur timestamps",
        "XMP metadata packets",
        "eXIf chunk (poora EXIF profile)",
        "Creation time identifiers",
        "Editing history tags",
      ],
      as: [
        "tEXt / zTXt / iTXt টেক্সট চাংক",
        "ছফ্টৱেৰৰ নাম আৰু সময়",
        "XMP মেটাডাটা পেকেট",
        "eXIf চাংক (সম্পূৰ্ণ EXIF)",
        "সৃষ্টিৰ সময়",
        "এডিটিং ইতিহাস টেগ",
      ],
    },
    faqs: {
      en: [
        {
          q: "Do PNGs really contain EXIF data?",
          a: "Yes. Since 2017, PNG officially supports an eXIf chunk carrying a full EXIF profile, and many editors write one. Text chunks with software names are even more common.",
        },
        {
          q: "Will my PNG stay lossless?",
          a: "Completely. Only ancillary chunks are dropped — the IDAT image data is never touched, so every pixel stays identical.",
        },
        {
          q: "What about screenshots?",
          a: "Screenshots often include your OS and app name plus a timestamp in text chunks. PureClear removes all of it in one pass.",
        },
      ],
      hi: [
        {
          q: "Kya PNG me sach me EXIF data hota hai?",
          a: "Haan. 2017 se PNG me eXIf chunk officially support hota hai jisme poora EXIF profile hota hai, aur kai editors ise likhte hain.",
        },
        {
          q: "Kya mera PNG lossless rahega?",
          a: "Poori tarah. Sirf ancillary chunks hataye jaate hain — IDAT image data ko chhua tak nahi jaata, har pixel identical rehta hai.",
        },
        {
          q: "Screenshot ka kya?",
          a: "Screenshot me aksar OS aur app ka naam plus timestamp text chunks me hota hai. PureClear ek hi pass me sab hata deta hai.",
        },
      ],
      as: [
        {
          q: "PNG ত সঁচাকৈয়ে EXIF ডাটা থাকে নেকি?",
          a: "হয়। ২০১৭ৰ পৰা PNG-ত eXIf চাংকত সম্পূৰ্ণ EXIF প্ৰ’ফাইল থাকে, আৰু বহু এডিটৰে ইয়াক লিখে।",
        },
        {
          q: "মোৰ PNG লচলেছ থাকিব নে?",
          a: "সম্পূৰ্ণ। কেৱল অতিৰিক্ত চাংক আঁতৰোৱা হয় — IDAT ছবিৰ ডাটা স্পৰ্শ কৰা নহয়।",
        },
        {
          q: "স্ক্ৰীণশ্বটৰ ক্ষেত্ৰত?",
          a: "স্ক্ৰীণশ্বটত সঘনাই OS আৰু এপৰ নাম থাকে। PureClear-এ একবাৰতে সকলো আঁতৰায়।",
        },
      ],
    },
  },
  {
    slug: "webp",
    name: "WebP",
    extensions: ["webp"],
    icon: "M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88ZM137,164.22a8,8,0,0,0-4.74,4.74L112,223.85,91.78,169A8,8,0,0,0,87,164.22L32.15,144,87,123.78A8,8,0,0,0,91.78,119L112,64.15,132.22,119a8,8,0,0,0,4.74,4.74L191.85,144ZM144,40a8,8,0,0,1,8-8h16V16a8,8,0,0,1,16,0V32h16a8,8,0,0,1,0,16H184V64a8,8,0,0,1-16,0V48H152A8,8,0,0,1,144,40ZM248,88a8,8,0,0,1-8,8h-8v8a8,8,0,0,1-16,0V96h-8a8,8,0,0,1,0-16h8V72a8,8,0,0,1,16,0v8h8A8,8,0,0,1,248,88Z",
    tagline: {
      en: "The modern web image",
      hi: "Modern web image",
      as: "আধুনিক ৱেব ছবি",
    },
    seoTitle: {
      en: "Remove Metadata from WebP — Free & Private",
      hi: "WebP se Metadata Hatayein — Free aur Private",
      as: "WebP ৰ পৰা মেটাডাটা আঁতৰাওক — বিনামূলীয়া",
    },
    seoDescription: {
      en: "Strip EXIF, XMP and ICC metadata from WebP images online. Free, lossless, 100% in-browser — transparency and animation preserved.",
      hi: "WebP image se EXIF, XMP aur ICC metadata online hatayein. Free, lossless, 100% browser me — transparency aur animation safe rehte hain.",
      as: "WebP ছবিৰ পৰা EXIF, XMP আৰু ICC মেটাডাটা অনলাইনত আঁতৰাওক। বিনামূলীয়া, লচলেছ, সম্পূৰ্ণ ব্ৰাউজাৰত।",
    },
    intro: {
      en: "WebP is Google's modern image format — smaller files, same privacy leak. It stores EXIF and XMP inside its VP8X container chunk, plus an ICC color profile. A WebP exported from Lightroom or an online converter can carry your full shooting data and GPS location, just like a JPEG.",
      hi: "WebP Google ka modern image format hai — chhoti file, wahi privacy leak. Isme VP8X container chunk me EXIF aur XMP store hota hai, plus ICC color profile. Lightroom se exported WebP me aapka poora shooting data aur GPS location ho sakta hai, bilkul JPEG ki tarah.",
      as: "WebP গুগলৰ আধুনিক ছবিৰ ফৰমেট — সৰু ফাইল, একেই গোপনীয়তাৰ সমস্যা। ইয়াৰ VP8X চাংকত EXIF আৰু XMP থাকে, লগতে ICC কালাৰ প্ৰ’ফাইল।",
    },
    removed: {
      en: [
        "EXIF profile (VP8X chunk)",
        "GPS location coordinates",
        "XMP metadata packets",
        "ICC color profile",
        "Software and timestamp tags",
        "Embedded thumbnail data",
      ],
      hi: [
        "EXIF profile (VP8X chunk)",
        "GPS location coordinates",
        "XMP metadata packets",
        "ICC color profile",
        "Software aur timestamp tags",
        "Embedded thumbnail data",
      ],
      as: [
        "EXIF প্ৰ’ফাইল (VP8X চাংক)",
        "GPS স্থানাংক",
        "XMP মেটাডাটা পেকেট",
        "ICC কালাৰ প্ৰ’ফাইল",
        "ছফ্টৱেৰ আৰু সময় টেগ",
        "এমবেডেড থাম্বনেইল",
      ],
    },
    faqs: {
      en: [
        {
          q: "Is WebP metadata the same as JPEG's?",
          a: "Structurally very similar — WebP embeds a standard EXIF blob, so the same camera settings and location data that leak from JPEGs leak from WebPs too.",
        },
        {
          q: "Does stripping affect transparency or animation?",
          a: "No. Only metadata chunks are removed. The image data, alpha channel and animation frames are preserved exactly.",
        },
        {
          q: "Why does my exported WebP still have metadata?",
          a: "Most editors preserve metadata on export by default. Stripping after export — right here — is the reliable fix.",
        },
      ],
      hi: [
        {
          q: "Kya WebP ka metadata JPEG jaisa hi hota hai?",
          a: "Sanrachna me bahut similar — WebP me standard EXIF blob embed hota hai, isliye wahi camera settings aur location data leak hota hai jo JPEG se hota hai.",
        },
        {
          q: "Kya strip karne se transparency ya animation par asar padega?",
          a: "Nahi. Sirf metadata chunks hataye jaate hain. Image data, alpha channel aur animation frames bilkul safe rehte hain.",
        },
        {
          q: "Mere exported WebP me ab bhi metadata kyun hai?",
          a: "Zyadatar editors export par default metadata preserve karte hain. Export ke baad yahan strip karna hi reliable fix hai.",
        },
      ],
      as: [
        {
          q: "WebP ৰ মেটাডাটা JPEG ৰ দৰেই নেকি?",
          a: "গঠনত একেই — WebP ত মানক EXIF থাকে, সেয়ে একেই কেমেৰা আৰু অৱস্থানৰ তথ্য প্ৰকাশ পায়।",
        },
        {
          q: "আঁতৰালে স্বচ্ছতা বা এনিমেচনত প্ৰভাৱ পৰিব নেকি?",
          a: "নপৰে। কেৱল মেটাডাটা চাংক আঁতৰোৱা হয়। ছবি, আলফা আৰু এনিমেচন সুৰক্ষিত থাকে।",
        },
        {
          q: "মোৰ এক্সপ’ৰ্ট কৰা WebP ত এতিয়াও মেটাডাটা কিয় আছে?",
          a: "বেছিভাগ এডিটৰে ডিফল্টভাৱে মেটাডাটা ৰাখে। এক্সপ’ৰ্টৰ পিছত ইয়াত আঁতৰোৱাই নিৰ্ভৰযোগ্য সমাধান।",
        },
      ],
    },
  },
  {
    slug: "heic",
    name: "HEIC",
    extensions: ["heic", "heif"],
    icon: "M201.54,54.46A104,104,0,0,0,54.46,201.54,104,104,0,0,0,201.54,54.46ZM190.23,65.78a88.18,88.18,0,0,1,11,13.48L167.55,119,139.63,40.78A87.34,87.34,0,0,1,190.23,65.78ZM155.59,133l-18.16,21.37-27.59-5L100.41,123l18.16-21.37,27.59,5ZM65.77,65.78a87.34,87.34,0,0,1,56.66-25.59l17.51,49L58.3,74.32A88,88,0,0,1,65.77,65.78ZM46.65,161.54a88.41,88.41,0,0,1,2.53-72.62l51.21,9.35Zm19.12,28.68a88.18,88.18,0,0,1-11-13.48L88.45,137l27.92,78.18A87.34,87.34,0,0,1,65.77,190.22Zm124.46,0a87.34,87.34,0,0,1-56.66,25.59l-17.51-49,81.64,14.91A88,88,0,0,1,190.23,190.22Zm-34.62-32.49,53.74-63.27a88.41,88.41,0,0,1-2.53,72.62Z",
    tagline: {
      en: "iPhone's default photo",
      hi: "iPhone ki default photo",
      as: "আইফোনৰ ডিফল্ট ফটো",
    },
    seoTitle: {
      en: "Remove EXIF Metadata from HEIC — Free & Private",
      hi: "HEIC se EXIF Metadata Hatayein — Free aur Private",
      as: "HEIC ৰ পৰা EXIF মেটাডাটা আঁতৰাওক — বিনামূলীয়া",
    },
    seoDescription: {
      en: "Strip EXIF, GPS and XMP metadata from HEIC/HEIF photos online. Free, 100% in-browser — iPhone photos cleaned without leaving your device.",
      hi: "HEIC/HEIF photo se EXIF, GPS aur XMP metadata online hatayein. Free, 100% browser me — iPhone photo device se bahar bheje bina saaf.",
      as: "HEIC/HEIF ফটোৰ পৰা EXIF, GPS আৰু XMP মেটাডাটা অনলাইনত আঁতৰাওক। বিনামূলীয়া, সম্পূৰ্ণ ব্ৰাউজাৰত।",
    },
    intro: {
      en: "HEIC has been the iPhone's default photo format since iOS 11 — and most people don't even realize their photos aren't JPEGs anymore. It stores EXIF and XMP inside its ISOBMFF box structure, including precise GPS coordinates. Every HEIC you AirDrop or upload can silently log exactly where you were standing.",
      hi: "iOS 11 se HEIC iPhone ka default photo format hai — aur zyadatar logon ko pata bhi nahi ki unki photo ab JPEG nahi rahi. Iske ISOBMFF box structure me EXIF aur XMP store hota hai, precise GPS coordinates ke saath. Har HEIC jo aap AirDrop ya upload karte hain, chupchaap bata sakta hai aap kahan khade the.",
      as: "iOS 11 ৰ পৰা HEIC আইফোনৰ ডিফল্ট ফটো ফৰমেট। ইয়াৰ ISOBMFF গাঁথনিত EXIF আৰু XMP থাকে, সঠিক GPS স্থানাংকসহ। প্ৰতিটো HEIC-এ নীৰৱে আপোনাৰ অৱস্থান প্ৰকাশ কৰিব পাৰে।",
    },
    removed: {
      en: [
        "EXIF data in ISOBMFF boxes",
        "GPS location coordinates",
        "XMP metadata",
        "Apple maker notes",
        "Embedded thumbnails",
        "Creation timestamps",
      ],
      hi: [
        "ISOBMFF boxes me EXIF data",
        "GPS location coordinates",
        "XMP metadata",
        "Apple maker notes",
        "Embedded thumbnails",
        "Creation timestamps",
      ],
      as: [
        "ISOBMFF বাকচত EXIF ডাটা",
        "GPS স্থানাংক",
        "XMP মেটাডাটা",
        "Apple মেকাৰ ন’ট",
        "এমবেডেড থাম্বনেইল",
        "সৃষ্টিৰ সময়",
      ],
    },
    faqs: {
      en: [
        {
          q: "Can browsers even read HEIC metadata?",
          a: "Most browsers can't display HEIC images at all — but the metadata is still in the file when you share it, and Apple devices, Windows and editors read it fully. The leak doesn't need a browser to happen.",
        },
        {
          q: "Does converting HEIC to JPEG remove metadata?",
          a: "Often not — converters frequently carry EXIF across to the new file. Strip the HEIC first with PureClear, then convert if you need to.",
        },
        {
          q: "Will the file still open on my iPhone after stripping?",
          a: "Yes. The HEVC image data is untouched — only metadata boxes are cleared, so the file remains a perfectly valid HEIC.",
        },
      ],
      hi: [
        {
          q: "Kya browser HEIC metadata padh bhi sakte hain?",
          a: "Zyadatar browser HEIC image dikha bhi nahi sakte — lekin file share karne par metadata usme rehta hai, aur Apple devices, Windows aur editors use poori tarah padhte hain.",
        },
        {
          q: "Kya HEIC ko JPEG me convert karne se metadata hat jaata hai?",
          a: "Aksar nahi — converter aksar EXIF ko nayi file me carry kar lete hain. Pehle PureClear se HEIC strip karo, phir convert karo.",
        },
        {
          q: "Strip ke baad file mere iPhone me khulegi?",
          a: "Haan. HEVC image data ko chhua nahi jaata — sirf metadata boxes clear hote hain, file bilkul valid HEIC rehti hai.",
        },
      ],
      as: [
        {
          q: "ব্ৰাউজাৰে HEIC মেটাডাটা পঢ়িব পাৰে নেকি?",
          a: "বেছিভাগ ব্ৰাউজাৰে HEIC দেখুৱাবই নোৱাৰে — কিন্তু শ্বেয়াৰ কৰিলে মেটাডাটা ফাইলত থাকে, আৰু Apple ডিভাইচে সম্পূৰ্ণ পঢ়ে।",
        },
        {
          q: "HEIC ক JPEG লৈ ৰূপান্তৰ কৰিলে মেটাডাটা আঁতৰে নেকি?",
          a: "সঘনাই নহয় — কনভাৰ্টাৰে EXIF কঢ়িয়াই নিয়ে। প্ৰথমে PureClear-এৰে আঁতৰাওক, তাৰ পিছত ৰূপান্তৰ কৰক।",
        },
        {
          q: "আঁতৰোৱাৰ পিছত ফাইল মোৰ আইফোনত খুলিব নে?",
          a: "হয়। HEVC ছবিৰ ডাটা স্পৰ্শ কৰা নহয় — কেৱল মেটাডাটা বাকচ পৰিষ্কাৰ হয়।",
        },
      ],
    },
  },
  {
    slug: "avif",
    name: "AVIF",
    extensions: ["avif"],
    icon: "M200,40H56A16,16,0,0,0,40,56V200a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V56A16,16,0,0,0,200,40Zm0,80H136V56h64ZM120,56v64H56V56ZM56,136h64v64H56Zm144,64H136V136h64v64Z",
    tagline: {
      en: "Next-gen open format",
      hi: "Next-gen open format",
      as: "পৰৱৰ্তী প্ৰজন্মৰ ফৰমেট",
    },
    seoTitle: {
      en: "Remove Metadata from AVIF — Free & Private",
      hi: "AVIF se Metadata Hatayein — Free aur Private",
      as: "AVIF ৰ পৰা মেটাডাটা আঁতৰাওক — বিনামূলীয়া",
    },
    seoDescription: {
      en: "Strip EXIF and XMP metadata from AVIF images online. Free, lossless, 100% in-browser — next-gen compression without the metadata trail.",
      hi: "AVIF image se EXIF aur XMP metadata online hatayein. Free, lossless, 100% browser me — next-gen compression, bina metadata trail ke.",
      as: "AVIF ছবিৰ পৰা EXIF আৰু XMP মেটাডাটা অনলাইনত আঁতৰাওক। বিনামূলীয়া, লচলেছ, সম্পূৰ্ণ ব্ৰাউজাৰত।",
    },
    intro: {
      en: "AVIF is the next-generation open image format — backed by Netflix, Google and Apple — built on the same ISOBMFF container as HEIC. It inherits the same metadata capabilities: EXIF and XMP boxes ride along with the ultra-efficient AV1 image data. Future-proof your privacy the same way you future-proofed your compression.",
      hi: "AVIF next-generation open image format hai — Netflix, Google aur Apple ka backing — HEIC wale hi ISOBMFF container par bana hai. Isme wahi metadata capabilities hain: ultra-efficient AV1 image data ke saath EXIF aur XMP boxes bhi aate hain.",
      as: "AVIF পৰৱৰ্তী প্ৰজন্মৰ মুকলি ছবিৰ ফৰমেট — Netflix, Google আৰু Appleৰ সমৰ্থনত — HEIC ৰ দৰে ISOBMFF আধাৰত নিৰ্মিত। ইয়াতো EXIF আৰু XMP বাকচ থাকে।",
    },
    removed: {
      en: [
        "EXIF metadata boxes",
        "GPS location data",
        "XMP metadata boxes",
        "Color and ICC metadata",
        "Embedded thumbnails",
        "Creation timestamps",
      ],
      hi: [
        "EXIF metadata boxes",
        "GPS location data",
        "XMP metadata boxes",
        "Color aur ICC metadata",
        "Embedded thumbnails",
        "Creation timestamps",
      ],
      as: [
        "EXIF মেটাডাটা বাকচ",
        "GPS অৱস্থান",
        "XMP মেটাডাটা বাকচ",
        "ৰং আৰু ICC মেটাডাটা",
        "এমবেডেড থাম্বনেইল",
        "সৃষ্টিৰ সময়",
      ],
    },
    faqs: {
      en: [
        {
          q: "Is AVIF metadata a real privacy risk yet?",
          a: "Yes. Any AVIF exported from a camera pipeline or editor can embed EXIF with location — exactly like HEIC. Adoption is growing fast in browsers, so the exposure surface is growing too.",
        },
        {
          q: "Does stripping break AVIF's HDR or wide color?",
          a: "No. The image essence boxes are preserved — only descriptive metadata boxes are removed. HDR and wide-gamut rendering are unaffected.",
        },
        {
          q: "Why strip AVIF if few apps read it?",
          a: "The apps that matter increasingly do — Chrome, Firefox, Safari and Android all support AVIF now. And a file you share today may be parsed more deeply tomorrow.",
        },
      ],
      hi: [
        {
          q: "Kya AVIF metadata abhi se real privacy risk hai?",
          a: "Haan. Camera pipeline ya editor se exported koi bhi AVIF EXIF ke saath location embed kar sakta hai — bilkul HEIC ki tarah. Browser adoption tezi se badh raha hai.",
        },
        {
          q: "Kya strip karne se AVIF ka HDR ya wide color tootega?",
          a: "Nahi. Image essence boxes preserved rehte hain — sirf descriptive metadata boxes hataye jaate hain. HDR par koi asar nahi.",
        },
        {
          q: "Jab kam apps ise padhte hain to strip kyun karein?",
          a: "Jo apps matter karte hain woh padhte hain — Chrome, Firefox, Safari, Android sab AVIF support karte hain. Aur aaj share ki file kal aur gehrai se parse ho sakti hai.",
        },
      ],
      as: [
        {
          q: "AVIF মেটাডাটা এতিয়াই গোপনীয়তাৰ বিপদ নেকি?",
          a: "হয়। কেমেৰা বা এডিটৰৰ পৰা অহা যিকোনো AVIF-ত অৱস্থানসহ EXIF থাকিব পাৰে — HEIC ৰ দৰেই।",
        },
        {
          q: "আঁতৰালে AVIF ৰ HDR বা ৱাইড কালাৰ নষ্ট হ’ব নেকি?",
          a: "নহ’ব। ছবিৰ মূল বাকচ সুৰক্ষিত থাকে — কেৱল বৰ্ণনামূলক মেটাডাটা আঁতৰোৱা হয়।",
        },
        {
          q: "কম এপে পঢ়িলে আঁতৰোৱাৰ প্ৰয়োজন কি?",
          a: "গুৰুত্বপূৰ্ণ এপবোৰে পঢ়ে — Chrome, Firefox, Safari, Android সকলোৱে AVIF সমৰ্থন কৰে।",
        },
      ],
    },
  },
  {
    slug: "gif",
    name: "GIF",
    extensions: ["gif"],
    icon: "M144,72V184a8,8,0,0,1-16,0V72a8,8,0,0,1,16,0Zm88-8H176a8,8,0,0,0-8,8V184a8,8,0,0,0,16,0V136h40a8,8,0,0,0,0-16H184V80h48a8,8,0,0,0,0-16ZM96,120H72a8,8,0,0,0,0,16H88v16a24,24,0,0,1-48,0V104A24,24,0,0,1,64,80c11.19,0,21.61,7.74,24.25,18a8,8,0,0,0,15.5-4C99.27,76.62,82.56,64,64,64a40,40,0,0,0-40,40v48a40,40,0,0,0,80,0V128A8,8,0,0,0,96,120Z",
    tagline: {
      en: "Animations and memes",
      hi: "Animations aur memes",
      as: "এনিমেচন আৰু মিম",
    },
    seoTitle: {
      en: "Remove Metadata from GIF — Free & Private",
      hi: "GIF se Metadata Hatayein — Free aur Private",
      as: "GIF ৰ পৰা মেটাডাটা আঁতৰাওক — বিনামূলীয়া",
    },
    seoDescription: {
      en: "Strip XMP and comment metadata from GIF animations online. Free, 100% in-browser — your memes loop on, minus the fingerprints.",
      hi: "GIF animation se XMP aur comment metadata online hatayein. Free, 100% browser me — meme waisa hi chalega, bina fingerprint ke.",
      as: "GIF এনিমেচনৰ পৰা XMP আৰু মন্তব্য মেটাডাটা অনলাইনত আঁতৰাওক। বিনামূলীয়া, সম্পূৰ্ণ ব্ৰাউজাৰত।",
    },
    intro: {
      en: "GIFs feel like 'just animations' — but the GIF89a spec allows comment extensions and application extensions, and modern tools embed XMP metadata in GIFs too. That meme you exported from Photoshop can carry authoring-tool fingerprints, timestamps and software version strings.",
      hi: "GIF 'bas animation' lagta hai — lekin GIF89a spec me comment extensions aur application extensions allowed hain, aur modern tools GIF me XMP metadata bhi embed karte hain. Photoshop se exported aapka meme authoring-tool ke fingerprint, timestamps aur software version leke ghoom sakta hai.",
      as: "GIF কেৱল এনিমেচন যেন লাগে — কিন্তু GIF89a-ত মন্তব্য এক্সটেনচনৰ অনুমতি আছে, আৰু আধুনিক সঁজুলিয়ে XMP মেটাডাটাও সুমুৱায়।",
    },
    removed: {
      en: [
        "XMP metadata packets",
        "Comment extensions",
        "Application extension data",
        "Software identifiers",
        "Version strings",
        "Timestamps",
      ],
      hi: [
        "XMP metadata packets",
        "Comment extensions",
        "Application extension data",
        "Software identifiers",
        "Version strings",
        "Timestamps",
      ],
      as: [
        "XMP মেটাডাটা পেকেট",
        "মন্তব্য এক্সটেনচন",
        "এপ্লিকেচন এক্সটেনচন ডাটা",
        "ছফ্টৱেৰ চিনাক্তকাৰী",
        "সংস্কৰণ তথ্য",
        "সময়",
      ],
    },
    faqs: {
      en: [
        {
          q: "Do GIFs really have metadata?",
          a: "Yes. Comment blocks and XMP packets are valid in GIF89a, and editors like Photoshop write them. They're invisible in playback — but trivially readable in the file.",
        },
        {
          q: "Will my animation still loop?",
          a: "Perfectly. Frame data, delays and loop counts are image data, not metadata — they're preserved exactly as they were.",
        },
        {
          q: "What about the color palette?",
          a: "Untouched. Only descriptive metadata is stripped; the global and local color tables stay identical.",
        },
      ],
      hi: [
        {
          q: "Kya GIF me sach me metadata hota hai?",
          a: "Haan. GIF89a me comment blocks aur XMP packets valid hain, aur Photoshop jaise editors ise likhte hain. Playback me invisible — lekin file me aasaani se padha ja sakta hai.",
        },
        {
          q: "Kya mera animation ab bhi loop karega?",
          a: "Bilkul. Frame data, delays aur loop counts image data hain, metadata nahi — bilkul waisa hi preserved rehta hai.",
        },
        {
          q: "Color palette ka kya hoga?",
          a: "Kuch nahi. Sirf descriptive metadata hataya jaata hai; color tables bilkul identical rehte hain.",
        },
      ],
      as: [
        {
          q: "GIF ত সঁচাকৈয়ে মেটাডাটা থাকে নেকি?",
          a: "হয়। GIF89a-ত মন্তব্য ব্লক আৰু XMP পেকেট বৈধ, আৰু Photoshop-এ লিখে।",
        },
        {
          q: "মোৰ এনিমেচন লুপ হৈ থাকিব নে?",
          a: "সম্পূৰ্ণ। ফ্ৰেম ডাটা আৰু লুপ গণনা ছবিৰ ডাটা — হুবহু সুৰক্ষিত থাকে।",
        },
        {
          q: "ৰঙৰ পেলেটৰ কি হ’ব?",
          a: "একো নহয়। কেৱল বৰ্ণনামূলক মেটাডাটা আঁতৰোৱা হয়।",
        },
      ],
    },
  },
  {
    slug: "mp4",
    name: "MP4",
    extensions: ["mp4"],
    icon: "M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm48.24-94.78-64-40A8,8,0,0,0,100,88v80a8,8,0,0,0,12.24,6.78l64-40a8,8,0,0,0,0-13.56ZM116,153.57V102.43L156.91,128Z",
    tagline: {
      en: "The universal video",
      hi: "Universal video format",
      as: "সাৰ্বজনীন ভিডিঅ’",
    },
    seoTitle: {
      en: "Remove Metadata from MP4 — Free & Private",
      hi: "MP4 se Metadata Hatayein — Free aur Private",
      as: "MP4 ৰ পৰা মেটাডাটা আঁতৰাওক — বিনামূলীয়া",
    },
    seoDescription: {
      en: "Strip GPS, timestamps and device metadata from MP4 videos online. Free, no re-encode, 100% in-browser — quality stays pixel-perfect.",
      hi: "MP4 video se GPS, timestamps aur device metadata online hatayein. Free, bina re-encode ke, 100% browser me — quality bilkul waisi hi.",
      as: "MP4 ভিডিঅ’ৰ পৰা GPS, সময় আৰু ডিভাইচ মেটাডাটা অনলাইনত আঁতৰাওক। বিনামূলীয়া, পুনৰ এনক’ড নহয়, সম্পূৰ্ণ ব্ৰাউজাৰত।",
    },
    intro: {
      en: "MP4 videos carry metadata in their moov atom — creation time, GPS location recorded by your phone, device model and encoder strings, even XMP. A video shared online can reveal where it was shot, when, and on what device — without a single frame giving it away visually.",
      hi: "MP4 video me metadata moov atom me hota hai — creation time, phone se record hua GPS location, device model aur encoder strings, yahan tak ki XMP. Online share kiya video bata sakta hai kahan shoot hua, kab, kis device par — bina ek bhi frame me dikhe.",
      as: "MP4 ভিডিঅ’ত moov এটমত মেটাডাটা থাকে — সৃষ্টিৰ সময়, ফোনে ৰেকৰ্ড কৰা GPS অৱস্থান, ডিভাইচ মডেল, আনকি XMP।",
    },
    removed: {
      en: [
        "GPS location atoms",
        "Creation and modification timestamps",
        "Device model identifiers",
        "Encoder software strings",
        "XMP metadata",
        "Cover art metadata",
      ],
      hi: [
        "GPS location atoms",
        "Creation aur modification timestamps",
        "Device model identifiers",
        "Encoder software strings",
        "XMP metadata",
        "Cover art metadata",
      ],
      as: [
        "GPS অৱস্থান এটম",
        "সৃষ্টি আৰু পৰিৱৰ্তনৰ সময়",
        "ডিভাইচ মডেল",
        "এনক’ডাৰ ছফ্টৱেৰ তথ্য",
        "XMP মেটাডাটা",
        "কভাৰ আৰ্ট মেটাডাটা",
      ],
    },
    faqs: {
      en: [
        {
          q: "Does stripping affect video quality?",
          a: "Zero impact. PureClear edits only the metadata atoms — audio and video streams are copied untouched with no re-encoding. Same pixels, same sound.",
        },
        {
          q: "Can a video really contain GPS data?",
          a: "Yes — phones routinely write location into video metadata. It's one of the most overlooked privacy leaks because nobody expects a video file to know where it was filmed.",
        },
        {
          q: "What about the 'shot on' device info?",
          a: "That's the device and encoder metadata — make, model, software version. PureClear removes all of it.",
        },
      ],
      hi: [
        {
          q: "Kya strip karne se video quality par asar padega?",
          a: "Bilkul nahi. PureClear sirf metadata atoms edit karta hai — audio aur video streams bina re-encoding ke copy hote hain. Same pixels, same sound.",
        },
        {
          q: "Kya video me sach me GPS data ho sakta hai?",
          a: "Haan — phone aam taur par video metadata me location likhte hain. Yeh sabse overlooked privacy leak hai kyunki koi expect nahi karta ki video file ko pata ho woh kahan shoot hui.",
        },
        {
          q: "'Shot on' device info ka kya?",
          a: "Woh device aur encoder metadata hai — make, model, software version. PureClear sab hata deta hai.",
        },
      ],
      as: [
        {
          q: "আঁতৰালে ভিডিঅ’ৰ মানত প্ৰভাৱ পৰিব নেকি?",
          a: "একো নপৰে। PureClear-এ কেৱল মেটাডাটা এটম সম্পাদনা কৰে — অডিঅ’ আৰু ভিডিঅ’ পুনৰ এনক’ড নকৰাকৈ কপি হয়।",
        },
        {
          q: "ভিডিঅ’ত সঁচাকৈয়ে GPS ডাটা থাকিব পাৰে নেকি?",
          a: "হয় — ফোনে নিয়মীয়াকৈ ভিডিঅ’ মেটাডাটাত অৱস্থান লিখে।",
        },
        {
          q: "ডিভাইচৰ তথ্যৰ কি হ’ব?",
          a: "সেয়া ডিভাইচ আৰু এনক’ডাৰ মেটাডাটা — PureClear-এ সকলো আঁতৰায়।",
        },
      ],
    },
  },
  {
    slug: "mov",
    name: "MOV",
    extensions: ["mov"],
    icon: "M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,88h80v80H40Zm96-16V56h32V72Zm-16,0H88V56h32Zm0,112v16H88V184Zm16,0h32v16H136Zm0-16V88h80v80Zm80-96H184V56h32ZM72,56V72H40V56ZM40,184H72v16H40Zm176,16H184V184h32v16Z",
    tagline: {
      en: "Apple's video format",
      hi: "Apple ka video format",
      as: "Appleৰ ভিডিঅ’ ফৰমেট",
    },
    seoTitle: {
      en: "Remove Metadata from MOV — Free & Private",
      hi: "MOV se Metadata Hatayein — Free aur Private",
      as: "MOV ৰ পৰা মেটাডাটা আঁতৰাওক — বিনামূলীয়া",
    },
    seoDescription: {
      en: "Strip GPS, timestamps and camera metadata from MOV videos online. Free, no re-encode, 100% in-browser — iPhone videos cleaned privately.",
      hi: "MOV video se GPS, timestamps aur camera metadata online hatayein. Free, bina re-encode ke, 100% browser me — iPhone video privately saaf.",
      as: "MOV ভিডিঅ’ৰ পৰা GPS, সময় আৰু কেমেৰা মেটাডাটা অনলাইনত আঁতৰাওক। বিনামূলীয়া, সম্পূৰ্ণ ব্ৰাউজাৰত।",
    },
    intro: {
      en: "MOV is Apple's QuickTime container — the default for iPhone video. It shares MP4's ISOBMFF heritage, so it carries the same metadata atoms: GPS coordinates, timestamps, camera model. Every MOV you AirDrop carries its location history along for the ride.",
      hi: "MOV Apple ka QuickTime container hai — iPhone video ka default. Yeh MP4 wale hi ISOBMFF parivara ka hai, isliye isme wahi metadata atoms hain: GPS coordinates, timestamps, camera model. Har MOV jo aap AirDrop karte hain, apni location history saath leke jaata hai.",
      as: "MOV Appleৰ QuickTime কণ্টেইনাৰ — আইফোন ভিডিঅ’ৰ ডিফল্ট। ই MP4 ৰ দৰে ISOBMFF ভিত্তিক, সেয়ে একেই মেটাডাটা এটম থাকে: GPS স্থানাংক, সময়, কেমেৰা মডেল।",
    },
    removed: {
      en: [
        "GPS location atoms",
        "Creation timestamps",
        "Camera and device metadata",
        "Encoder strings",
        "XMP metadata",
        "Poster frame metadata",
      ],
      hi: [
        "GPS location atoms",
        "Creation timestamps",
        "Camera aur device metadata",
        "Encoder strings",
        "XMP metadata",
        "Poster frame metadata",
      ],
      as: [
        "GPS অৱস্থান এটম",
        "সৃষ্টিৰ সময়",
        "কেমেৰা আৰু ডিভাইচ মেটাডাটা",
        "এনক’ডাৰ তথ্য",
        "XMP মেটাডাটা",
        "প’ষ্টাৰ ফ্ৰেম মেটাডাটা",
      ],
    },
    faqs: {
      en: [
        {
          q: "Is MOV metadata different from MP4?",
          a: "Structurally they're cousins — both built on ISOBMFF. The same location, timestamp and device leaks apply to both, and PureClear handles them identically.",
        },
        {
          q: "Will it still play in QuickTime after stripping?",
          a: "Yes. Media data is untouched — the file remains a perfectly valid MOV that plays everywhere it did before.",
        },
        {
          q: "Does it clean the video part of Live Photos?",
          a: "The .mov component of a Live Photo carries the same metadata atoms. Strip it the same way — upload the .mov here.",
        },
      ],
      hi: [
        {
          q: "Kya MOV ka metadata MP4 se alag hota hai?",
          a: "Sanrachna me cousins hain — dono ISOBMFF par bane hain. Wahi location, timestamp aur device leaks dono me hote hain, aur PureClear dono ko identically handle karta hai.",
        },
        {
          q: "Strip ke baad QuickTime me chalega?",
          a: "Haan. Media data untouched rehta hai — file bilkul valid MOV rehti hai, jahan pehle chalti thi wahan chalegi.",
        },
        {
          q: "Kya Live Photos ke video part ko saaf karega?",
          a: "Live Photo ka .mov component wahi metadata atoms carry karta hai. Use bhi waise hi strip karo — .mov yahan upload karo.",
        },
      ],
      as: [
        {
          q: "MOV ৰ মেটাডাটা MP4 তকৈ বেলেগ নেকি?",
          a: "গঠনত একেই পৰিয়াল — দুয়ো ISOBMFF ভিত্তিক। একেই অৱস্থান আৰু ডিভাইচৰ তথ্য থাকে।",
        },
        {
          q: "আঁতৰোৱাৰ পিছত QuickTime ত চলিব নে?",
          a: "হয়। মিডিয়া ডাটা স্পৰ্শ কৰা নহয় — ফাইল বৈধ MOV হৈ থাকে।",
        },
        {
          q: "Live Photos ৰ ভিডিঅ’ অংশ পৰিষ্কাৰ হ’ব নে?",
          a: "Live Photo ৰ .mov অংশত একেই মেটাডাটা থাকে। একেদৰে আঁতৰাওক।",
        },
      ],
    },
  },
  {
    slug: "pdf",
    name: "PDF",
    extensions: ["pdf"],
    icon: "M224,152a8,8,0,0,1-8,8H192v16h16a8,8,0,0,1,0,16H192v16a8,8,0,0,1-16,0V152a8,8,0,0,1,8-8h32A8,8,0,0,1,224,152ZM92,172a28,28,0,0,1-28,28H56v8a8,8,0,0,1-16,0V152a8,8,0,0,1,8-8H64A28,28,0,0,1,92,172Zm-16,0a12,12,0,0,0-12-12H56v24h8A12,12,0,0,0,76,172Zm88,8a36,36,0,0,1-36,36H112a8,8,0,0,1-8-8V152a8,8,0,0,1,8-8h16A36,36,0,0,1,164,180Zm-16,0a20,20,0,0,0-20-20h-8v40h8A20,20,0,0,0,148,180ZM40,112V40A16,16,0,0,1,56,24h96a8,8,0,0,1,5.66,2.34l56,56A8,8,0,0,1,216,88v24a8,8,0,0,1-16,0V96H152a8,8,0,0,1-8-8V40H56v72a8,8,0,0,1-16,0ZM160,80h28.69L160,51.31Z",
    tagline: {
      en: "Documents and scans",
      hi: "Documents aur scans",
      as: "নথি আৰু স্কেন",
    },
    seoTitle: {
      en: "Remove Metadata from PDF — Free & Private",
      hi: "PDF se Metadata Hatayein — Free aur Private",
      as: "PDF ৰ পৰা মেটাডাটা আঁতৰাওক — বিনামূলীয়া",
    },
    seoDescription: {
      en: "Strip author, XMP and hidden metadata from PDF documents online — every page swept. Free, 100% in-browser, your documents never uploaded.",
      hi: "PDF document se author, XMP aur chhupa metadata online hatayein — har page sweep hota hai. Free, 100% browser me, document kabhi upload nahi hota.",
      as: "PDF নথিৰ পৰা লেখক, XMP আৰু লুকাই থকা মেটাডাটা অনলাইনত আঁতৰাওক — প্ৰতিটো পৃষ্ঠা পৰিষ্কাৰ। বিনামূলীয়া, সম্পূৰ্ণ ব্ৰাউজাৰত।",
    },
    intro: {
      en: "PDFs carry two layers of metadata: the Info dictionary (title, author, creation date, producer app) and XMP packets — potentially on every single page. Supposedly anonymous documents have been de-anonymized through PDF metadata for decades. PureClear sweeps both layers, page by page, so nothing hides in page 47.",
      hi: "PDF me metadata ki do layer hoti hain: Info dictionary (title, author, creation date, producer app) aur XMP packets — sambhavatah har page par. PDF metadata se 'anonymous' documents decades se de-anonymize hote aaye hain. PureClear dono layers ko page-by-page sweep karta hai.",
      as: "PDF ত মেটাডাটাৰ দুটা স্তৰ থাকে: Info অভিধান (শিৰোনাম, লেখক, তাৰিখ) আৰু XMP পেকেট — প্ৰতিটো পৃষ্ঠাতে থাকিব পাৰে। PureClear-এ পৃষ্ঠা-পৃষ্ঠাকৈ দুয়োটা স্তৰ পৰিষ্কাৰ কৰে।",
    },
    removed: {
      en: [
        "Info dictionary — author, title, dates",
        "XMP packets on every page",
        "Producer and creator app strings",
        "Embedded file metadata",
        "Thumbnail previews",
        "Document IDs and version history",
      ],
      hi: [
        "Info dictionary — author, title, dates",
        "Har page par XMP packets",
        "Producer aur creator app strings",
        "Embedded file metadata",
        "Thumbnail previews",
        "Document IDs aur version history",
      ],
      as: [
        "Info অভিধান — লেখক, শিৰোনাম, তাৰিখ",
        "প্ৰতিটো পৃষ্ঠাত XMP পেকেট",
        "প্ৰস্তুতকাৰী এপৰ তথ্য",
        "এমবেডেড ফাইল মেটাডাটা",
        "থাম্বনেইল প্ৰিভিউ",
        "নথি ID আৰু সংস্কৰণ ইতিহাস",
      ],
    },
    faqs: {
      en: [
        {
          q: "Why does PureClear sweep every page?",
          a: "PDFs can store XMP metadata per page, not just per document. A document-level clean can miss page-level metadata — so PureClear checks all pages, not just the cover.",
        },
        {
          q: "Does it change how my PDF looks?",
          a: "No. Content streams are never touched — only metadata dictionaries are cleared. Text, images and layout stay identical.",
        },
        {
          q: "Does this redact blacked-out text?",
          a: "No — and this matters. Stripping metadata is not redaction: if you covered text with black boxes without removing it, the text is still in the content layer. Use a proper redaction tool for that.",
        },
      ],
      hi: [
        {
          q: "PureClear har page kyun sweep karta hai?",
          a: "PDF me XMP metadata har page par ho sakta hai, sirf document level par nahi. Document-level clean page-level metadata miss kar sakta hai — isliye PureClear saare pages check karta hai.",
        },
        {
          q: "Kya mera PDF dikhne me badlega?",
          a: "Nahi. Content streams ko kabhi chhua nahi jaata — sirf metadata dictionaries clear hoti hain. Text, images aur layout bilkul same rehte hain.",
        },
        {
          q: "Kya yeh blacked-out text ko redact karta hai?",
          a: "Nahi — aur yeh zaroori hai samajhna. Metadata strip karna redaction nahi hai: agar aapne text ko kaale boxes se dhaka hai bina hataye, to text ab bhi content layer me hai. Uske liye proper redaction tool use karo.",
        },
      ],
      as: [
        {
          q: "PureClear-এ প্ৰতিটো পৃষ্ঠা কিয় পৰিষ্কাৰ কৰে?",
          a: "PDF ত XMP মেটাডাটা প্ৰতিটো পৃষ্ঠাতে থাকিব পাৰে। সেয়ে PureClear-এ সকলো পৃষ্ঠা পৰীক্ষা কৰে।",
        },
        {
          q: "মোৰ PDF দেখাত সলনি হ’ব নেকি?",
          a: "নহ’ব। বিষয়বস্তু স্পৰ্শ কৰা নহয় — কেৱল মেটাডাটা অভিধান পৰিষ্কাৰ হয়।",
        },
        {
          q: "ই ক’লা কৰা লিখনি মচিব নেকি?",
          a: "নোৱাৰে — মেটাডাটা আঁতৰোৱা redaction নহয়। ঢকা লিখনি এতিয়াও ফাইলত থাকে।",
        },
      ],
    },
  },
];

export function getFormat(slug: string | undefined): FormatInfo | undefined {
  return FORMATS.find((f) => f.slug === slug);
}

export const FORMAT_SLUGS = FORMATS.map((f) => f.slug);
