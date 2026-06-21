export interface Prize {
  value: string;
  type?: string;
  status?: string;
}

export interface LocationData {
  _id?: string;
  location: string;
  code: string;
  gEight: Prize[];
  gSeven: Prize[];
  gSix: Prize[];
  gFive: Prize[];
  gFour: Prize[];
  gThree: Prize[];
  gTwo: Prize[];
  gOne: Prize[];
  db: Prize[];
  [key: string]: any;
}

export interface LotteryPeriod {
  name: string;
  displayTable?: string;
  displayNumber?: string;
  gEight?: string;
  gSeven?: string;
  gSix?: string;
  gFive?: string;
  gFour?: string;
  gThree?: string;
  gTwo?: string;
  gOne?: string;
  db?: string;
  data: LocationData[];
  [key: string]: any;
}

export interface LotteryState {
  _id: string;
  date: string;
  first: LotteryPeriod;
  second: LotteryPeriod;
  third: LotteryPeriod;
  fourth: LotteryPeriod;
}

export interface Advertisement {
  _id: string;
  title: string;
  position: 'Left' | 'Right' | 'Center';
  image: string;
  status: boolean;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
}

export interface GeneralSettings {
  _id: string;
  logo: string;
  fullLogo: string;
  leftFooterContent: string;
  rightFooterContent: string;
}

const initialGeneral: GeneralSettings = {
  _id: "general-1",
  logo: "/logo.png",
  fullLogo: "/full-logo.png",
  leftFooterContent: "<p>© 2026 VISOTHAP. All rights reserved.</p>",
  rightFooterContent: "<p>Contact: info@visothap.net | Hotline: 1900 6868</p>"
};

const initialUsers: User[] = [
  { _id: "user-1", username: "administrator", email: "admin@visothap.net", role: "Admin" },
  { _id: "user-2", username: "staff_member", email: "staff@visothap.net", role: "Staff" }
];

const initialAds: Advertisement[] = [
  { _id: "ads-1", title: "Bia Saigon Gold", position: "Left", image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400&q=80", status: true },
  { _id: "ads-2", title: "Vé Số Kiến Thiết", position: "Left", image: "https://images.unsplash.com/photo-1777896116711-837c58809f9c?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", status: true },
  { _id: "ads-3", title: "Đông Á Bank", position: "Right", image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=400&q=80", status: true },
  { _id: "ads-4", title: "Trà Xanh Không Độ", position: "Right", image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80", status: true },
  { _id: "ads-5", title: "Khuyến Mãi Lớn", position: "Center", image: "https://images.unsplash.com/photo-1472851294608-062f824d296e?auto=format&fit=crop&w=800&q=80", status: true },
  { _id: "ads-6", title: "Cơm Tấm Cali", position: "Center", image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80", status: true }
];

export const getInitialLotteryState = (dateString: string): LotteryState => {
  return {
    _id: `lottery-${dateString}`,
    date: dateString,
    first: {
      name: "Sổ Kết Quả Miền Trung",
      displayTable: "first",
      displayNumber: "10:50 AM",
      gEight: "Giải Tám",
      gSeven: "Giải Bảy",
      gSix: "Giải Sáu",
      gFive: "Giải Năm",
      gFour: "Giải Tư",
      gThree: "Giải Ba",
      gTwo: "Giải Nhì",
      gOne: "Giải Nhất",
      db: "Đặc Biệt",
      data: [
        {
          location: "TP. Đà Nẵng",
          code: "XSDNG",
          gEight: [{ value: "85", type: "gEight", status: "done" }],
          gSeven: [{ value: "246", type: "gSeven", status: "done" }],
          gSix: [
            { value: "4820", type: "gSix", status: "done" },
            { value: "1940", type: "gSix", status: "done" },
            { value: "7311", type: "gSix", status: "done" }
          ],
          gFive: [{ value: "9021", type: "gFive", status: "done" }],
          gFour: [
            { value: "18293", type: "gFour", status: "done" },
            { value: "50284", type: "gFour", status: "done" },
            { value: "29381", type: "gFour", status: "done" },
            { value: "74028", type: "gFour", status: "done" },
            { value: "93028", type: "gFour", status: "done" },
            { value: "11928", type: "gFour", status: "done" },
            { value: "62518", type: "gFour", status: "done" }
          ],
          gThree: [
            { value: "58291", type: "gThree", status: "done" },
            { value: "40294", type: "gThree", status: "done" }
          ],
          gTwo: [{ value: "83028", type: "gTwo", status: "done" }],
          gOne: [{ value: "92837", type: "gOne", status: "done" }],
          db: [{ value: "492048", type: "db", status: "done" }]
        },
        {
          location: "Khánh Hòa",
          code: "XSKH",
          gEight: [{ value: "42", type: "gEight", status: "done" }],
          gSeven: [{ value: "731", type: "gSeven", status: "done" }],
          gSix: [
            { value: "8492", type: "gSix", status: "done" },
            { value: "5028", type: "gSix", status: "done" },
            { value: "6110", type: "gSix", status: "done" }
          ],
          gFive: [{ value: "3948", type: "gFive", status: "done" }],
          gFour: [
            { value: "94028", type: "gFour", status: "done" },
            { value: "60293", type: "gFour", status: "done" },
            { value: "29481", type: "gFour", status: "done" },
            { value: "84920", type: "gFour", status: "done" },
            { value: "59302", type: "gFour", status: "done" },
            { value: "72190", type: "gFour", status: "done" },
            { value: "30491", type: "gFour", status: "done" }
          ],
          gThree: [
            { value: "74839", type: "gThree", status: "done" },
            { value: "29304", type: "gThree", status: "done" }
          ],
          gTwo: [{ value: "49281", type: "gTwo", status: "done" }],
          gOne: [{ value: "74920", type: "gOne", status: "done" }],
          db: [{ value: "849301", type: "db", status: "done" }]
        },
        {
          location: "Kon Tum",
          code: "XSKT",
          gEight: [{ value: "93", type: "gEight", status: "done" }],
          gSeven: [{ value: "829", type: "gSeven", status: "done" }],
          gSix: [
            { value: "5830", type: "gSix", status: "done" },
            { value: "9283", type: "gSix", status: "done" },
            { value: "3748", type: "gSix", status: "done" }
          ],
          gFive: [{ value: "1938", type: "gFive", status: "done" }],
          gFour: [
            { value: "84920", type: "gFour", status: "done" },
            { value: "59381", type: "gFour", status: "done" },
            { value: "20482", type: "gFour", status: "done" },
            { value: "69381", type: "gFour", status: "done" },
            { value: "74839", type: "gFour", status: "done" },
            { value: "19284", type: "gFour", status: "done" },
            { value: "58291", type: "gFour", status: "done" }
          ],
          gThree: [
            { value: "92847", type: "gThree", status: "done" },
            { value: "48201", type: "gThree", status: "done" }
          ],
          gTwo: [{ value: "39481", type: "gTwo", status: "done" }],
          gOne: [{ value: "92048", type: "gOne", status: "done" }],
          db: [{ value: "294829", type: "db", status: "done" }]
        }
      ]
    },
    second: {
      name: "Sổ Kết Quả Miền Đông",
      displayTable: "second",
      displayNumber: "1:50 PM",
      gEight: "Giải Tám",
      gSeven: "Giải Bảy",
      gSix: "Giải Sáu",
      gFive: "Giải Năm",
      gFour: "Giải Tư",
      gThree: "Giải Ba",
      gTwo: "Giải Nhì",
      gOne: "Giải Nhất",
      db: "Đặc Biệt",
      data: [
        {
          location: "Bình Dương",
          code: "XSBD",
          gEight: [{ value: "12", type: "gEight", status: "done" }],
          gSeven: [{ value: "456", type: "gSeven", status: "done" }],
          gSix: [
            { value: "7890", type: "gSix", status: "done" },
            { value: "2345", type: "gSix", status: "done" },
            { value: "6789", type: "gSix", status: "done" }
          ],
          gFive: [{ value: "9012", type: "gFive", status: "done" }],
          gFour: [
            { value: "34567", type: "gFour", status: "done" },
            { value: "89012", type: "gFour", status: "done" },
            { value: "56789", type: "gFour", status: "done" },
            { value: "12345", type: "gFour", status: "done" },
            { value: "67890", type: "gFour", status: "done" },
            { value: "23456", type: "gFour", status: "done" },
            { value: "78901", type: "gFour", status: "done" }
          ],
          gThree: [
            { value: "23456", type: "gThree", status: "done" },
            { value: "78901", type: "gThree", status: "done" }
          ],
          gTwo: [{ value: "34567", type: "gTwo", status: "done" }],
          gOne: [{ value: "89012", type: "gOne", status: "done" }],
          db: [{ value: "123456", type: "db", status: "done" }]
        },
        {
          location: "Tây Ninh",
          code: "XSTN",
          gEight: [{ value: "34", type: "gEight", status: "done" }],
          gSeven: [{ value: "789", type: "gSeven", status: "done" }],
          gSix: [
            { value: "1234", type: "gSix", status: "done" },
            { value: "5678", type: "gSix", status: "done" },
            { value: "9012", type: "gSix", status: "done" }
          ],
          gFive: [{ value: "3456", type: "gFive", status: "done" }],
          gFour: [
            { value: "78901", type: "gFour", status: "done" },
            { value: "23456", type: "gFour", status: "done" },
            { value: "90123", type: "gFour", status: "done" },
            { value: "45678", type: "gFour", status: "done" },
            { value: "12345", type: "gFour", status: "done" },
            { value: "67890", type: "gFour", status: "done" },
            { value: "34567", type: "gFour", status: "done" }
          ],
          gThree: [
            { value: "89012", type: "gThree", status: "done" },
            { value: "34567", type: "gThree", status: "done" }
          ],
          gTwo: [{ value: "90123", type: "gTwo", status: "done" }],
          gOne: [{ value: "45678", type: "gOne", status: "done" }],
          db: [{ value: "901234", type: "db", status: "done" }]
        },
        {
          location: "An Giang",
          code: "XSAG",
          gEight: [{ value: "56", type: "gEight", status: "done" }],
          gSeven: [{ value: "901", type: "gSeven", status: "done" }],
          gSix: [
            { value: "2345", type: "gSix", status: "done" },
            { value: "6789", type: "gSix", status: "done" },
            { value: "0123", type: "gSix", status: "done" }
          ],
          gFive: [{ value: "4567", type: "gFive", status: "done" }],
          gFour: [
            { value: "89012", type: "gFour", status: "done" },
            { value: "34567", type: "gFour", status: "done" },
            { value: "01234", type: "gFour", status: "done" },
            { value: "56789", type: "gFour", status: "done" },
            { value: "23456", type: "gFour", status: "done" },
            { value: "78901", type: "gFour", status: "done" },
            { value: "45678", type: "gFour", status: "done" }
          ],
          gThree: [
            { value: "90123", type: "gThree", status: "done" },
            { value: "45678", type: "gThree", status: "done" }
          ],
          gTwo: [{ value: "01234", type: "gTwo", status: "done" }],
          gOne: [{ value: "56789", type: "gOne", status: "done" }],
          db: [{ value: "012345", type: "db", status: "done" }]
        }
      ]
    },
    third: {
      name: "Sổ Kết Quả Miền Nam",
      displayTable: "third",
      displayNumber: "4:50 PM",
      gEight: "Giải Tám",
      gSeven: "Giải Bảy",
      gSix: "Giải Sáu",
      gFive: "Giải Năm",
      gFour: "Giải Tư",
      gThree: "Giải Ba",
      gTwo: "Giải Nhì",
      gOne: "Giải Nhất",
      db: "Đặc Biệt",
      data: [
        {
          location: "TP. HCM",
          code: "XSHCM",
          gEight: [{ value: "78", type: "gEight", status: "done" }],
          gSeven: [{ value: "234", type: "gSeven", status: "done" }],
          gSix: [
            { value: "5678", type: "gSix", status: "done" },
            { value: "9012", type: "gSix", status: "done" },
            { value: "3456", type: "gSix", status: "done" }
          ],
          gFive: [{ value: "7890", type: "gFive", status: "done" }],
          gFour: [
            { value: "12345", type: "gFour", status: "done" },
            { value: "67890", type: "gFour", status: "done" },
            { value: "34567", type: "gFour", status: "done" },
            { value: "89012", type: "gFour", status: "done" },
            { value: "45678", type: "gFour", status: "done" },
            { value: "90123", type: "gFour", status: "done" },
            { value: "56789", type: "gFour", status: "done" }
          ],
          gThree: [
            { value: "01234", type: "gThree", status: "done" },
            { value: "56789", type: "gThree", status: "done" }
          ],
          gTwo: [{ value: "12345", type: "gTwo", status: "done" }],
          gOne: [{ value: "67890", type: "gOne", status: "done" }],
          db: [{ value: "987654", type: "db", status: "done" }]
        },
        {
          location: "Đồng Tháp",
          code: "XSDT",
          gEight: [{ value: "90", type: "gEight", status: "done" }],
          gSeven: [{ value: "567", type: "gSeven", status: "done" }],
          gSix: [
            { value: "8901", type: "gSix", status: "done" },
            { value: "2345", type: "gSix", status: "done" },
            { value: "6789", type: "gSix", status: "done" }
          ],
          gFive: [{ value: "0123", type: "gFive", status: "done" }],
          gFour: [
            { value: "45678", type: "gFour", status: "done" },
            { value: "90123", type: "gFour", status: "done" },
            { value: "56789", type: "gFour", status: "done" },
            { value: "01234", type: "gFour", status: "done" },
            { value: "56789", type: "gFour", status: "done" },
            { value: "23456", type: "gFour", status: "done" },
            { value: "78901", type: "gFour", status: "done" }
          ],
          gThree: [
            { value: "23456", type: "gThree", status: "done" },
            { value: "78901", type: "gThree", status: "done" }
          ],
          gTwo: [{ value: "34567", type: "gTwo", status: "done" }],
          gOne: [{ value: "89012", type: "gOne", status: "done" }],
          db: [{ value: "765432", type: "db", status: "done" }]
        },
        {
          location: "Cà Mau",
          code: "XSCM",
          gEight: [{ value: "12", type: "gEight", status: "done" }],
          gSeven: [{ value: "890", type: "gSeven", status: "done" }],
          gSix: [
            { value: "3456", type: "gSix", status: "done" },
            { value: "7890", type: "gSix", status: "done" },
            { value: "1234", type: "gSix", status: "done" }
          ],
          gFive: [{ value: "5678", type: "gFive", status: "done" }],
          gFour: [
            { value: "90123", type: "gFour", status: "done" },
            { value: "45678", type: "gFour", status: "done" },
            { value: "12345", type: "gFour", status: "done" },
            { value: "67890", type: "gFour", status: "done" },
            { value: "23456", type: "gFour", status: "done" },
            { value: "78901", type: "gFour", status: "done" },
            { value: "45678", type: "gFour", status: "done" }
          ],
          gThree: [
            { value: "89012", type: "gThree", status: "done" },
            { value: "34567", type: "gThree", status: "done" }
          ],
          gTwo: [{ value: "90123", type: "gTwo", status: "done" }],
          gOne: [{ value: "45678", type: "gOne", status: "done" }],
          db: [{ value: "543210", type: "db", status: "done" }]
        }
      ]
    },
    fourth: {
      name: "Sổ Kết Quả Miền Bắc",
      displayTable: "fourth",
      displayNumber: "6:45 PM",
      gEight: "Giải Tám", // Just fallback
      gSeven: "Giải Bảy",
      gSix: "Giải Sáu",
      gFive: "Giải Năm",
      gFour: "Giải Tư",
      gThree: "Giải Ba",
      gTwo: "Giải Nhì",
      gOne: "Giải Nhất",
      db: "Đặc Biệt",
      data: [
        {
          location: "Miền Bắc",
          code: "XSMB",
          gEight: [{ value: "", type: "gEight", status: "done" }], // Dummy, MB has no G8
          gSeven: [
            { value: "18", type: "gSeven", status: "done" },
            { value: "92", type: "gSeven", status: "done" },
            { value: "35", type: "gSeven", status: "done" },
            { value: "76", type: "gSeven", status: "done" }
          ],
          gSix: [
            { value: "248", type: "gSix", status: "done" },
            { value: "591", type: "gSix", status: "done" },
            { value: "384", type: "gSix", status: "done" }
          ],
          gFive: [
            { value: "2847", type: "gFive", status: "done" },
            { value: "1920", type: "gFive", status: "done" },
            { value: "8394", type: "gFive", status: "done" },
            { value: "5839", type: "gFive", status: "done" },
            { value: "1029", type: "gFive", status: "done" },
            { value: "9283", type: "gFive", status: "done" }
          ],
          gFour: [
            { value: "9382", type: "gFour", status: "done" },
            { value: "4829", type: "gFour", status: "done" },
            { value: "1029", type: "gFour", status: "done" },
            { value: "7483", type: "gFour", status: "done" }
          ],
          gThree: [
            { value: "19204", type: "gThree", status: "done" },
            { value: "83928", type: "gThree", status: "done" },
            { value: "48294", type: "gThree", status: "done" },
            { value: "10293", type: "gThree", status: "done" },
            { value: "84920", type: "gThree", status: "done" },
            { value: "48204", type: "gThree", status: "done" }
          ],
          gTwo: [
            { value: "93828", type: "gTwo", status: "done" },
            { value: "48201", type: "gTwo", status: "done" }
          ],
          gOne: [{ value: "19284", type: "gOne", status: "done" }],
          db: [{ value: "849201", type: "db", status: "done" }]
        }
      ]
    }
  };
};

export const getGeneralSettings = (): GeneralSettings => {
  if (typeof window === "undefined") return initialGeneral;
  const saved = localStorage.getItem("general_settings");
  if (saved) return JSON.parse(saved);
  localStorage.setItem("general_settings", JSON.stringify(initialGeneral));
  return initialGeneral;
};

export const saveGeneralSettings = (settings: GeneralSettings) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("general_settings", JSON.stringify(settings));
};

export const getAdvertisements = (): Advertisement[] => {
  if (typeof window === "undefined") return initialAds;
  const saved = localStorage.getItem("advertisements");
  if (saved) return JSON.parse(saved);
  localStorage.setItem("advertisements", JSON.stringify(initialAds));
  return initialAds;
};

export const saveAdvertisements = (ads: Advertisement[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("advertisements", JSON.stringify(ads));
};

export const getUsers = (): User[] => {
  if (typeof window === "undefined") return initialUsers;
  const saved = localStorage.getItem("users");
  if (saved) return JSON.parse(saved);
  localStorage.setItem("users", JSON.stringify(initialUsers));
  return initialUsers;
};

export const saveUsers = (users: User[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("users", JSON.stringify(users));
};

export const getLotteryData = (dateString: string): LotteryState => {
  if (typeof window === "undefined") return getInitialLotteryState(dateString);
  const key = `lottery_${dateString}`;
  const saved = localStorage.getItem(key);
  if (saved) return JSON.parse(saved);

  const newState = getInitialLotteryState(dateString);
  localStorage.setItem(key, JSON.stringify(newState));
  return newState;
};

export const saveLotteryData = (dateString: string, state: LotteryState) => {
  if (typeof window === "undefined") return;
  const key = `lottery_${dateString}`;
  localStorage.setItem(key, JSON.stringify(state));
};
