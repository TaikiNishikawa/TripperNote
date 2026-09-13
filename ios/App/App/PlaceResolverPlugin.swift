import Foundation
import Capacitor
import MapKit
import CoreLocation

@objc(PlaceResolverPlugin)
public class PlaceResolverPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PlaceResolverPlugin"
    public let jsName = "PlaceResolverPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "resolvePlace", returnType: CAPPluginReturnPromise)
    ]

    @objc func resolvePlace(_ call: CAPPluginCall) {
        let rawQuery = (call.getString("query") ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        let mapsURL = (call.getString("googleMapsUrl") ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        let preferMapsURL = call.getBool("preferMapsUrl") ?? false

        guard !rawQuery.isEmpty || !mapsURL.isEmpty else {
            call.reject("検索する目的地名・住所・Google Maps URLがありません。")
            return
        }

        if preferMapsURL, !mapsURL.isEmpty {
            resolveGoogleMapsURL(mapsURL, fallbackQuery: rawQuery, call: call) { [weak self] resolved in
                guard let self = self else { return }
                if resolved { return }
                if !rawQuery.isEmpty {
                    self.performMapKitSearch(query: rawQuery, call: call)
                } else {
                    call.resolve(["found": false])
                }
            }
            return
        }

        if !rawQuery.isEmpty {
            performMapKitSearch(query: rawQuery, call: call)
        } else {
            resolveGoogleMapsURL(mapsURL, fallbackQuery: rawQuery, call: call) { resolved in
                if !resolved { call.resolve(["found": false]) }
            }
        }
    }

    private func performMapKitSearch(query: String, call: CAPPluginCall) {
        let request = MKLocalSearch.Request()
        request.naturalLanguageQuery = query

        if let hintLat = call.getDouble("hintLat"),
           let hintLon = call.getDouble("hintLon"),
           (-90.0...90.0).contains(hintLat),
           (-180.0...180.0).contains(hintLon) {
            let span = max(0.05, min(call.getDouble("span") ?? 1.5, 10.0))
            request.region = MKCoordinateRegion(
                center: CLLocationCoordinate2D(latitude: hintLat, longitude: hintLon),
                span: MKCoordinateSpan(latitudeDelta: span, longitudeDelta: span)
            )
        }

        let search = MKLocalSearch(request: request)
        search.start { response, error in
            if let error = error {
                call.reject("目的地検索に失敗しました: \(error.localizedDescription)")
                return
            }
            guard let mapItems = response?.mapItems, !mapItems.isEmpty else {
                call.resolve(["found": false])
                return
            }

            let resultItems = mapItems.prefix(5).map { item -> [String: Any] in
                let coordinate = item.placemark.coordinate
                return [
                    "name": item.name ?? query,
                    "address": item.placemark.title ?? "",
                    "lat": coordinate.latitude,
                    "lon": coordinate.longitude
                ]
            }
            guard let first = resultItems.first else {
                call.resolve(["found": false])
                return
            }
            call.resolve([
                "found": true,
                "name": first["name"] ?? query,
                "address": first["address"] ?? "",
                "lat": first["lat"] ?? 0,
                "lon": first["lon"] ?? 0,
                "candidates": resultItems,
                "query": query,
                "source": "mapkit"
            ])
        }
    }

    private func resolveGoogleMapsURL(_ rawURL: String,
                                      fallbackQuery: String,
                                      call: CAPPluginCall,
                                      completion: @escaping (Bool) -> Void) {
        guard let url = URL(string: rawURL),
              let scheme = url.scheme?.lowercased(),
              scheme == "http" || scheme == "https" else {
            completion(false)
            return
        }

        var request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 12)
        request.setValue("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1", forHTTPHeaderField: "User-Agent")

        URLSession.shared.dataTask(with: request) { [weak self] _, response, error in
            guard let self = self else { return }
            guard error == nil, let finalURL = response?.url else {
                DispatchQueue.main.async { completion(false) }
                return
            }

            let finalString = finalURL.absoluteString
            let coordinate = self.extractCoordinate(from: finalString)
            let urlPlaceName = self.extractPlaceName(from: finalURL)
            let searchName = !urlPlaceName.isEmpty ? urlPlaceName : fallbackQuery

            guard let coordinate = coordinate else {
                if !searchName.isEmpty {
                    DispatchQueue.main.async {
                        self.searchNearFinalURLName(searchName, call: call, completion: completion)
                    }
                } else {
                    DispatchQueue.main.async { completion(false) }
                }
                return
            }

            let finish: (String) -> Void = { address in
                let name = !searchName.isEmpty ? searchName : fallbackQuery
                call.resolve([
                    "found": true,
                    "name": name,
                    "address": address,
                    "lat": coordinate.latitude,
                    "lon": coordinate.longitude,
                    "query": fallbackQuery,
                    "source": "google_maps_url",
                    "resolvedUrl": finalString
                ])
                completion(true)
            }

            let geocoder = CLGeocoder()
            geocoder.reverseGeocodeLocation(CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude)) { placemarks, _ in
                let address = placemarks?.first?.name ?? ""
                DispatchQueue.main.async { finish(address) }
            }
        }.resume()
    }

    private func searchNearFinalURLName(_ query: String,
                                        call: CAPPluginCall,
                                        completion: @escaping (Bool) -> Void) {
        let request = MKLocalSearch.Request()
        request.naturalLanguageQuery = query
        let search = MKLocalSearch(request: request)
        search.start { response, _ in
            guard let item = response?.mapItems.first else {
                completion(false)
                return
            }
            let coordinate = item.placemark.coordinate
            call.resolve([
                "found": true,
                "name": item.name ?? query,
                "address": item.placemark.title ?? "",
                "lat": coordinate.latitude,
                "lon": coordinate.longitude,
                "query": query,
                "source": "google_maps_url"
            ])
            completion(true)
        }
    }

    private func extractCoordinate(from text: String) -> CLLocationCoordinate2D? {
        let patterns = [
            #"@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)"#,
            #"!3d(-?\d{1,3}(?:\.\d+)?)[^!]*!4d(-?\d{1,3}(?:\.\d+)?)"#,
            #"(?:query|destination|q|ll)=(-?\d{1,3}(?:\.\d+)?)(?:%2C|,)(-?\d{1,3}(?:\.\d+)?)"#
        ]
        for pattern in patterns {
            guard let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) else { continue }
            let range = NSRange(text.startIndex..<text.endIndex, in: text)
            guard let match = regex.firstMatch(in: text, range: range), match.numberOfRanges >= 3,
                  let latRange = Range(match.range(at: 1), in: text),
                  let lonRange = Range(match.range(at: 2), in: text),
                  let lat = Double(text[latRange]), let lon = Double(text[lonRange]),
                  (-90.0...90.0).contains(lat), (-180.0...180.0).contains(lon) else { continue }
            return CLLocationCoordinate2D(latitude: lat, longitude: lon)
        }
        return nil
    }

    private func extractPlaceName(from url: URL) -> String {
        let components = url.pathComponents
        if let index = components.firstIndex(of: "place"), components.indices.contains(index + 1) {
            let raw = components[index + 1]
            return raw.removingPercentEncoding?.replacingOccurrences(of: "+", with: " ") ?? raw
        }
        if let queryItems = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems {
            for key in ["query", "q", "destination"] {
                if let value = queryItems.first(where: { $0.name == key })?.value, !value.isEmpty {
                    return value
                }
            }
        }
        return ""
    }
}
