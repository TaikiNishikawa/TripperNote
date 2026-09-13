/* Tripper Note v2.5.2 Stability - schema v4 */
const SCHEMA_VERSION = 5;
const MAX_PLANS = 4;
const MAX_CANDIDATES = 4;
const NAV_APP_OPTIONS = {
  "car": [
    {
      "id": "yahoo_carnavi",
      "label": "Yahoo!カーナビ"
    },
    {
      "id": "google_maps",
      "label": "Google Maps"
    },
    {
      "id": "apple_maps",
      "label": "Apple Maps"
    }
  ],
  "walk": [
    {
      "id": "google_maps",
      "label": "Google Maps"
    },
    {
      "id": "apple_maps",
      "label": "Apple Maps"
    }
  ],
  "train": [
    {
      "id": "yahoo_transit",
      "label": "Yahoo!乗換案内"
    },
    {
      "id": "google_maps",
      "label": "Google Maps"
    },
    {
      "id": "apple_maps",
      "label": "Apple Maps"
    }
  ]
};
const DEFAULT_APP_DATA = {
  "schemaVersion": 3,
  "activeTripId": "hokuto-2026-09",
  "settings": {
    "navigation": {
      "car": "yahoo_carnavi",
      "walk": "google_maps",
      "train": "yahoo_transit"
    },
    "calendarEntry": "header"
  },
  "trips": [
    {
      "id": "hokuto-2026-09",
      "title": "北杜・小淵沢",
      "icon": "🌿",
      "startDate": "2026-09-08",
      "endDate": "2026-09-09",
      "transportBookings": [],
      "days": [
        {
          "day": 1,
          "date": "2026-09-08",
          "activePlanId": "a",
          "lodging": {
            "name": "White Bird",
            "address": "山梨県北杜市小淵沢町1499-7",
            "checkInDate": "2026-09-08",
            "checkInTime": "15:00",
            "checkOutDate": "2026-09-09",
            "checkOutTime": "",
            "room": "",
            "reservationNumber": "",
            "parking": "",
            "memo": "",
            "googleMapsUrl": "",
            "lat": 35.87504,
            "lon": 138.32069
          },
          "plans": [
            {
              "id": "a",
              "name": "基本プラン",
              "slots": [
                {
                  "id": "d1-home",
                  "selectedCandidateId": "d1-home-c1",
                  "candidates": [
                    {
                      "id": "d1-home-c1",
                      "name": "🏠 自宅｜尻手 出発",
                      "destination": "尻手",
                      "activity": "北杜・小淵沢へ向けて出発",
                      "description": "最初の立ち寄りはmomona 菓子店です。",
                      "transportMode": "none",
                      "googleMapsUrl": "",
                      "address": "",
                      "lat": null,
                      "lon": null,
                      "stationName": "",
                      "memo": "",
                      "tags": [
                        "出発"
                      ]
                    }
                  ],
                  "startTime": "07:30",
                  "endTime": "",
                  "timeNote": ""
                },
                {
                  "id": "d1-momona",
                  "selectedCandidateId": "d1-momona-c1",
                  "candidates": [
                    {
                      "id": "d1-momona-c1",
                      "name": "🎂 momona 菓子店",
                      "destination": "momona 菓子店",
                      "activity": "ケーキ受け取り",
                      "description": "予約したケーキを受け取ります。",
                      "transportMode": "car",
                      "googleMapsUrl": "https://maps.app.goo.gl/eGqrynRjyj7T3Fro9?g_st=ic",
                      "address": "",
                      "lat": 35.65454888,
                      "lon": 138.55306533,
                      "stationName": "",
                      "memo": "",
                      "tags": [
                        "ケーキ受取",
                        "予約"
                      ]
                    }
                  ],
                  "startTime": "11:00",
                  "endTime": "",
                  "timeNote": ""
                },
                {
                  "id": "d1-michinoeki",
                  "selectedCandidateId": "d1-michinoeki-c1",
                  "candidates": [
                    {
                      "id": "d1-michinoeki-c1",
                      "name": "🛒 道の駅こぶちざわ",
                      "destination": "道の駅こぶちざわ",
                      "activity": "買い出し",
                      "description": "White Birdでのディナー・パーティーに必要な食材や飲み物などを買い出し。",
                      "transportMode": "car",
                      "googleMapsUrl": "",
                      "address": "",
                      "lat": 35.8794698,
                      "lon": 138.3159143,
                      "stationName": "",
                      "memo": "",
                      "tags": [
                        "買い出し",
                        "道の駅"
                      ]
                    }
                  ],
                  "startTime": "11:40",
                  "endTime": "",
                  "timeNote": "11:00以降"
                },
                {
                  "id": "d1-pause",
                  "selectedCandidateId": "d1-pause-c1",
                  "candidates": [
                    {
                      "id": "d1-pause-c1",
                      "name": "🍽️ pause 小淵沢",
                      "destination": "pause 小淵沢",
                      "activity": "ランチ",
                      "description": "コースランチ ¥4,500。",
                      "transportMode": "car",
                      "googleMapsUrl": "https://maps.app.goo.gl/DFomfFoQyfjbuehz5?g_st=ic",
                      "address": "",
                      "lat": 35.853579518151,
                      "lon": 138.33528510713,
                      "stationName": "",
                      "memo": "",
                      "tags": [
                        "ランチ",
                        "コース ¥4,500"
                      ]
                    }
                  ],
                  "startTime": "13:15",
                  "endTime": "",
                  "timeNote": ""
                },
                {
                  "id": "d1-whitebird-in",
                  "selectedCandidateId": "d1-whitebird-in-c1",
                  "candidates": [
                    {
                      "id": "d1-whitebird-in-c1",
                      "name": "🏡 White Bird",
                      "destination": "White Bird",
                      "activity": "チェックイン",
                      "description": "荷物を置いたら徒歩でリゾナーレ八ヶ岳へ。",
                      "transportMode": "car",
                      "googleMapsUrl": "",
                      "address": "山梨県北杜市小淵沢町1499-7",
                      "lat": 35.87504,
                      "lon": 138.32069,
                      "stationName": "",
                      "memo": "",
                      "tags": [
                        "宿泊",
                        "チェックイン"
                      ]
                    }
                  ],
                  "startTime": "15:00",
                  "endTime": "",
                  "timeNote": ""
                },
                {
                  "id": "d1-risonare",
                  "selectedCandidateId": "d1-risonare-c1",
                  "candidates": [
                    {
                      "id": "d1-risonare-c1",
                      "name": "🍷 リゾナーレ八ヶ岳",
                      "destination": "星野リゾート リゾナーレ八ヶ岳",
                      "activity": "散策",
                      "description": "ワインテイスティング、ジェラートなどを楽しむ予定。",
                      "transportMode": "walk",
                      "googleMapsUrl": "",
                      "address": "",
                      "lat": null,
                      "lon": null,
                      "stationName": "",
                      "memo": "",
                      "tags": [
                        "徒歩",
                        "ワイン",
                        "ジェラート"
                      ]
                    }
                  ],
                  "startTime": "15:30",
                  "endTime": "",
                  "timeNote": "チェックイン後"
                },
                {
                  "id": "d1-whitebird-back",
                  "selectedCandidateId": "d1-whitebird-back-c1",
                  "candidates": [
                    {
                      "id": "d1-whitebird-back-c1",
                      "name": "🏡 White Bird",
                      "destination": "White Bird",
                      "activity": "拠点へ戻る",
                      "description": "リゾナーレ八ヶ岳から戻り、ディナーの準備へ。",
                      "transportMode": "walk",
                      "googleMapsUrl": "",
                      "address": "山梨県北杜市小淵沢町1499-7",
                      "lat": 35.87504,
                      "lon": 138.32069,
                      "stationName": "",
                      "memo": "",
                      "tags": [
                        "宿へ戻る"
                      ]
                    }
                  ],
                  "startTime": "18:00",
                  "endTime": "",
                  "timeNote": ""
                },
                {
                  "id": "d1-party",
                  "selectedCandidateId": "d1-party-c1",
                  "candidates": [
                    {
                      "id": "d1-party-c1",
                      "name": "🍳🎉 ディナー・パーティー",
                      "destination": "White Bird",
                      "activity": "料理・ディナー・パーティー・お祝い",
                      "description": "White Birdで料理をしながらゆっくりディナー。ケーキと一緒にお祝い。",
                      "transportMode": "none",
                      "googleMapsUrl": "",
                      "address": "山梨県北杜市小淵沢町1499-7",
                      "lat": 35.87504,
                      "lon": 138.32069,
                      "stationName": "",
                      "memo": "",
                      "tags": [
                        "料理",
                        "ディナー",
                        "お祝い"
                      ]
                    }
                  ],
                  "startTime": "18:00",
                  "endTime": "",
                  "timeNote": ""
                }
              ]
            }
          ]
        },
        {
          "day": 2,
          "date": "2026-09-09",
          "activePlanId": "a",
          "lodging": null,
          "plans": [
            {
              "id": "a",
              "name": "自然＆カフェ",
              "slots": [
                {
                  "id": "d2a-whitebird",
                  "selectedCandidateId": "d2a-whitebird-c1",
                  "candidates": [
                    {
                      "id": "d2a-whitebird-c1",
                      "name": "🏡 White Bird",
                      "destination": "White Bird",
                      "activity": "朝食・チェックアウト",
                      "description": "朝食後にチェックアウト。",
                      "transportMode": "none",
                      "googleMapsUrl": "",
                      "address": "山梨県北杜市小淵沢町1499-7",
                      "lat": 35.87504,
                      "lon": 138.32069,
                      "stationName": "",
                      "memo": "",
                      "tags": [
                        "Plan A"
                      ]
                    }
                  ],
                  "startTime": "08:00",
                  "endTime": "09:00",
                  "timeNote": ""
                },
                {
                  "id": "d2a-toryu",
                  "selectedCandidateId": "d2a-toryu-c1",
                  "candidates": [
                    {
                      "id": "d2a-toryu-c1",
                      "name": "🌿 吐竜の滝",
                      "destination": "吐竜の滝",
                      "activity": "自然散策",
                      "description": "雨上がりなら候補。駐車場から徒歩移動があります。",
                      "transportMode": "car",
                      "googleMapsUrl": "",
                      "address": "",
                      "lat": 35.914579,
                      "lon": 138.419505,
                      "stationName": "",
                      "memo": "駐車場から滝までは徒歩移動あり",
                      "tags": [
                        "自然",
                        "Plan A"
                      ]
                    }
                  ],
                  "startTime": "09:30",
                  "endTime": "10:30",
                  "timeNote": ""
                },
                {
                  "id": "d2a-eloise",
                  "selectedCandidateId": "d2a-eloise-c1",
                  "candidates": [
                    {
                      "id": "d2a-eloise-c1",
                      "name": "☕ ELOISE's Café YATSUGATAKE",
                      "destination": "ELOISE's Café YATSUGATAKE",
                      "activity": "カフェ",
                      "description": "北杜市長坂町大八田1555-1 8BASE 1F。",
                      "transportMode": "car",
                      "googleMapsUrl": "",
                      "address": "山梨県北杜市長坂町大八田1555-1 8BASE 1F",
                      "lat": 35.8389812,
                      "lon": 138.39038038,
                      "stationName": "",
                      "memo": "",
                      "tags": [
                        "カフェ",
                        "Plan A"
                      ]
                    }
                  ],
                  "startTime": "10:45",
                  "endTime": "11:30",
                  "timeNote": ""
                },
                {
                  "id": "d2a-grape",
                  "selectedCandidateId": "d2a-grape-c1",
                  "candidates": [
                    {
                      "id": "d2a-grape-c1",
                      "name": "🍇 ぶどう狩り",
                      "destination": "勝沼エリア ぶどう狩り",
                      "activity": "ぶどう狩り",
                      "description": "勝沼エリア。農園は確定後に住所・座標を登録。",
                      "transportMode": "car",
                      "googleMapsUrl": "",
                      "address": "",
                      "lat": null,
                      "lon": null,
                      "stationName": "",
                      "memo": "",
                      "tags": [
                        "Plan A"
                      ]
                    }
                  ],
                  "startTime": "12:30",
                  "endTime": "13:30",
                  "timeNote": ""
                },
                {
                  "id": "d2a-winery",
                  "selectedCandidateId": "d2a-winery-c1",
                  "candidates": [
                    {
                      "id": "d2a-winery-c1",
                      "name": "🍷 マンズワイン勝沼ワイナリー",
                      "destination": "マンズワイン勝沼ワイナリー",
                      "activity": "ワイン購入・見学",
                      "description": "運転者は試飲せず、お土産購入を中心に。",
                      "transportMode": "car",
                      "googleMapsUrl": "",
                      "address": "山梨県甲州市勝沼町山400",
                      "lat": 35.6842421,
                      "lon": 138.7228444,
                      "stationName": "",
                      "memo": "",
                      "tags": [
                        "Plan A"
                      ]
                    }
                  ],
                  "startTime": "13:45",
                  "endTime": "14:30",
                  "timeNote": ""
                },
                {
                  "id": "d2a-food",
                  "selectedCandidateId": "d2a-food-c1",
                  "candidates": [
                    {
                      "id": "d2a-food-c1",
                      "name": "🍽️ 山梨グルメ",
                      "destination": "勝沼 山梨グルメ",
                      "activity": "遅めの昼食・軽食",
                      "description": "店名は今後確定。",
                      "transportMode": "car",
                      "googleMapsUrl": "",
                      "address": "",
                      "lat": null,
                      "lon": null,
                      "stationName": "",
                      "memo": "",
                      "tags": [
                        "Plan A"
                      ]
                    }
                  ],
                  "startTime": "14:45",
                  "endTime": "15:30",
                  "timeNote": ""
                },
                {
                  "id": "d2a-home",
                  "selectedCandidateId": "d2a-home-c1",
                  "candidates": [
                    {
                      "id": "d2a-home-c1",
                      "name": "🚗 川崎へ帰路",
                      "destination": "尻手駅",
                      "activity": "帰宅",
                      "description": "勝沼方面から川崎へ。",
                      "transportMode": "car",
                      "googleMapsUrl": "",
                      "address": "",
                      "lat": 35.5308118,
                      "lon": 139.6843418,
                      "stationName": "",
                      "memo": "",
                      "tags": [
                        "帰宅"
                      ]
                    }
                  ],
                  "startTime": "15:45",
                  "endTime": "",
                  "timeNote": ""
                }
              ]
            },
            {
              "id": "b",
              "name": "雨天・屋内",
              "slots": [
                {
                  "id": "d2b-whitebird",
                  "selectedCandidateId": "d2b-whitebird-c1",
                  "candidates": [
                    {
                      "id": "d2b-whitebird-c1",
                      "name": "🏡 White Bird",
                      "destination": "White Bird",
                      "activity": "朝食・チェックアウト",
                      "description": "雨天プランで出発準備。",
                      "transportMode": "none",
                      "googleMapsUrl": "",
                      "address": "山梨県北杜市小淵沢町1499-7",
                      "lat": 35.87504,
                      "lon": 138.32069,
                      "stationName": "",
                      "memo": "",
                      "tags": [
                        "Plan B"
                      ]
                    }
                  ],
                  "startTime": "08:00",
                  "endTime": "09:00",
                  "timeNote": ""
                },
                {
                  "id": "d2b-center",
                  "selectedCandidateId": "d2b-center-c1",
                  "candidates": [
                    {
                      "id": "d2b-center-c1",
                      "name": "🌲 山梨県立八ケ岳自然ふれあいセンター",
                      "destination": "山梨県立八ケ岳自然ふれあいセンター",
                      "activity": "屋内展示・自然情報",
                      "description": "雨でも立ち寄りやすい屋内スポット。",
                      "transportMode": "car",
                      "googleMapsUrl": "",
                      "address": "",
                      "lat": 35.92614,
                      "lon": 138.42143,
                      "stationName": "",
                      "memo": "",
                      "tags": [
                        "雨天",
                        "Plan B"
                      ]
                    }
                  ],
                  "startTime": "09:15",
                  "endTime": "10:00",
                  "timeNote": ""
                },
                {
                  "id": "d2b-keith",
                  "selectedCandidateId": "d2b-keith-c1",
                  "candidates": [
                    {
                      "id": "d2b-keith-c1",
                      "name": "🎨 中村キース・ヘリング美術館",
                      "destination": "中村キース・ヘリング美術館",
                      "activity": "美術館鑑賞",
                      "description": "雨天時のメイン候補。",
                      "transportMode": "car",
                      "googleMapsUrl": "",
                      "address": "",
                      "lat": null,
                      "lon": null,
                      "stationName": "",
                      "memo": "",
                      "tags": [
                        "屋内",
                        "Plan B"
                      ]
                    }
                  ],
                  "startTime": "10:15",
                  "endTime": "11:30",
                  "timeNote": ""
                },
                {
                  "id": "d2b-grape",
                  "selectedCandidateId": "d2b-grape-c1",
                  "candidates": [
                    {
                      "id": "d2b-grape-c1",
                      "name": "🍇 勝沼グレパーク",
                      "destination": "勝沼グレパーク",
                      "activity": "ぶどう狩り",
                      "description": "勝沼方面へ移動。",
                      "transportMode": "car",
                      "googleMapsUrl": "",
                      "address": "",
                      "lat": null,
                      "lon": null,
                      "stationName": "",
                      "memo": "",
                      "tags": [
                        "Plan B"
                      ]
                    }
                  ],
                  "startTime": "12:30",
                  "endTime": "13:30",
                  "timeNote": ""
                },
                {
                  "id": "d2b-winefood",
                  "selectedCandidateId": "d2b-winefood-c1",
                  "candidates": [
                    {
                      "id": "d2b-winefood-c1",
                      "name": "🍷 マンズワイン ＆ 山梨グルメ",
                      "destination": "マンズワイン勝沼ワイナリー",
                      "activity": "ワイン購入・山梨グルメ",
                      "description": "ワイナリーと食事をまとめて楽しむ。",
                      "transportMode": "car",
                      "googleMapsUrl": "",
                      "address": "山梨県甲州市勝沼町山400",
                      "lat": 35.6842421,
                      "lon": 138.7228444,
                      "stationName": "",
                      "memo": "",
                      "tags": [
                        "Plan B"
                      ]
                    }
                  ],
                  "startTime": "13:45",
                  "endTime": "15:00",
                  "timeNote": ""
                },
                {
                  "id": "d2b-home",
                  "selectedCandidateId": "d2b-home-c1",
                  "candidates": [
                    {
                      "id": "d2b-home-c1",
                      "name": "🚗 川崎へ帰路",
                      "destination": "尻手駅",
                      "activity": "帰宅",
                      "description": "勝沼方面から川崎へ。",
                      "transportMode": "car",
                      "googleMapsUrl": "",
                      "address": "",
                      "lat": 35.5308118,
                      "lon": 139.6843418,
                      "stationName": "",
                      "memo": "",
                      "tags": [
                        "帰宅"
                      ]
                    }
                  ],
                  "startTime": "15:30",
                  "endTime": "",
                  "timeNote": ""
                }
              ]
            },
            {
              "id": "c",
              "name": "富士急",
              "slots": [
                {
                  "id": "d2c-whitebird",
                  "selectedCandidateId": "d2c-whitebird-c1",
                  "candidates": [
                    {
                      "id": "d2c-whitebird-c1",
                      "name": "🏡 White Bird 出発",
                      "destination": "White Bird",
                      "activity": "チェックアウト・出発",
                      "description": "富士急プランで出発。",
                      "transportMode": "none",
                      "googleMapsUrl": "",
                      "address": "山梨県北杜市小淵沢町1499-7",
                      "lat": 35.87504,
                      "lon": 138.32069,
                      "stationName": "",
                      "memo": "",
                      "tags": [
                        "Plan C"
                      ]
                    }
                  ],
                  "startTime": "09:00",
                  "endTime": "",
                  "timeNote": ""
                },
                {
                  "id": "d2c-grape",
                  "selectedCandidateId": "d2c-grape-c1",
                  "candidates": [
                    {
                      "id": "d2c-grape-c1",
                      "name": "🍇 勝沼エリアでぶどう狩り",
                      "destination": "勝沼 ぶどう狩り",
                      "activity": "ぶどう狩り",
                      "description": "午前中にぶどう狩り。",
                      "transportMode": "car",
                      "googleMapsUrl": "",
                      "address": "",
                      "lat": null,
                      "lon": null,
                      "stationName": "",
                      "memo": "",
                      "tags": [
                        "Plan C"
                      ]
                    }
                  ],
                  "startTime": "10:15",
                  "endTime": "11:15",
                  "timeNote": ""
                },
                {
                  "id": "d2c-winery",
                  "selectedCandidateId": "d2c-winery-c1",
                  "candidates": [
                    {
                      "id": "d2c-winery-c1",
                      "name": "🍷 マンズワイン勝沼ワイナリー",
                      "destination": "マンズワイン勝沼ワイナリー",
                      "activity": "ワイン購入",
                      "description": "短時間で立ち寄り。",
                      "transportMode": "car",
                      "googleMapsUrl": "",
                      "address": "山梨県甲州市勝沼町山400",
                      "lat": 35.6842421,
                      "lon": 138.7228444,
                      "stationName": "",
                      "memo": "",
                      "tags": [
                        "Plan C"
                      ]
                    }
                  ],
                  "startTime": "11:30",
                  "endTime": "12:00",
                  "timeNote": ""
                },
                {
                  "id": "d2c-fujiq",
                  "selectedCandidateId": "d2c-fujiq-c1",
                  "candidates": [
                    {
                      "id": "d2c-fujiq-c1",
                      "name": "🎢 富士急ハイランド",
                      "destination": "富士急ハイランド",
                      "activity": "アトラクション",
                      "description": "午後は富士急ハイランドへ。",
                      "transportMode": "car",
                      "googleMapsUrl": "",
                      "address": "",
                      "lat": 35.4859554,
                      "lon": 138.7798437,
                      "stationName": "",
                      "memo": "",
                      "tags": [
                        "Plan C"
                      ]
                    }
                  ],
                  "startTime": "12:45",
                  "endTime": "16:30",
                  "timeNote": ""
                },
                {
                  "id": "d2c-home",
                  "selectedCandidateId": "d2c-home-c1",
                  "candidates": [
                    {
                      "id": "d2c-home-c1",
                      "name": "🚗 川崎へ帰路",
                      "destination": "尻手駅",
                      "activity": "帰宅",
                      "description": "河口湖方面から川崎へ。",
                      "transportMode": "car",
                      "googleMapsUrl": "",
                      "address": "",
                      "lat": 35.5308118,
                      "lon": 139.6843418,
                      "stationName": "",
                      "memo": "",
                      "tags": [
                        "帰宅"
                      ]
                    }
                  ],
                  "startTime": "16:45",
                  "endTime": "",
                  "timeNote": ""
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};
const NAV_POINTS = [
  {
    "keys": [
      "momona 菓子店",
      "momona菓子店"
    ],
    "name": "momona 菓子店",
    "lat": 35.65454888,
    "lon": 138.55306533
  },
  {
    "keys": [
      "道の駅こぶちざわ"
    ],
    "name": "道の駅こぶちざわ",
    "lat": 35.8794698,
    "lon": 138.3159143
  },
  {
    "keys": [
      "pause 小淵沢",
      "pause小淵沢"
    ],
    "name": "pause 小淵沢",
    "lat": 35.853579518151,
    "lon": 138.33528510713
  },
  {
    "keys": [
      "White Bird",
      "white bird"
    ],
    "name": "White Bird",
    "lat": 35.87504,
    "lon": 138.32069
  },
  {
    "keys": [
      "吐竜の滝"
    ],
    "name": "吐竜の滝",
    "lat": 35.914579,
    "lon": 138.419505
  },
  {
    "keys": [
      "ELOISE's Café YATSUGATAKE",
      "ELOISEs Cafe YATSUGATAKE",
      "ELOISE's Cafe YATSUGATAKE"
    ],
    "name": "ELOISE's Café YATSUGATAKE",
    "lat": 35.8389812,
    "lon": 138.39038038
  },
  {
    "keys": [
      "山梨県立八ケ岳自然ふれあいセンター",
      "山梨県立八ヶ岳自然ふれあいセンター"
    ],
    "name": "山梨県立八ケ岳自然ふれあいセンター",
    "lat": 35.92614,
    "lon": 138.42143
  },
  {
    "keys": [
      "マンズワイン勝沼ワイナリー",
      "マンズワイン"
    ],
    "name": "マンズワイン勝沼ワイナリー",
    "lat": 35.6842421,
    "lon": 138.7228444
  },
  {
    "keys": [
      "富士急ハイランド"
    ],
    "name": "富士急ハイランド",
    "lat": 35.4859554,
    "lon": 138.7798437
  },
  {
    "keys": [
      "勝沼IC",
      "勝沼ＩＣ"
    ],
    "name": "勝沼IC",
    "lat": 35.6522691,
    "lon": 138.734407
  },
  {
    "keys": [
      "尻手駅",
      "尻手",
      "川崎"
    ],
    "name": "尻手駅",
    "lat": 35.5308118,
    "lon": 139.6843418
  }
];
