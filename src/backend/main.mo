import Set "mo:core/Set";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Float "mo:core/Float";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Int "mo:core/Int";
import Order "mo:core/Order";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import OutCall "http-outcalls/outcall";

actor {
  // State to store the admin principal persistently
  var adminPrincipal : ?Principal = null;

  // Initialize the access control system for role-based access
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type Latitude = Float;
  type Longitude = Float;
  type HaversineDistance = Float;
  type RepeaterId = Nat;
  type ZipCode = Text;

  public type Status = {
    #active;
    #inactive;
  };

  public type SubmissionStatus = {
    #pending;
    #approved;
    #rejected;
  };

  public type Repeater = {
    id : Nat;
    frequency : Float;
    offset : Float;
    callSign : Text;
    sponsor : Text;
    city : Text;
    state : Text;
    zipCode : Text;
    ctcssTone : Text;
    dcsCode : Text;
    toneMode : Text;
    coverageDescription : Text;
    operationalNotes : Text;
    autopatchInfo : Text;
    linkInfo : Text;
    status : Status;
    submissionStatus : SubmissionStatus;
    submittedBy : Text;
    timestamp : Time.Time;
  };

  public type NewRepeater = {
    frequency : Float;
    offset : Float;
    callSign : Text;
    sponsor : Text;
    city : Text;
    state : Text;
    zipCode : Text;
    ctcssTone : Text;
    dcsCode : Text;
    toneMode : Text;
    coverageDescription : Text;
    operationalNotes : Text;
    autopatchInfo : Text;
    linkInfo : Text;
    status : Status;
    submittedBy : Text;
  };

  public type UpdateRepeaterData = {
    frequency : ?Float;
    offset : ?Float;
    callSign : ?Text;
    sponsor : ?Text;
    city : ?Text;
    state : ?Text;
    zipCode : ?Text;
    ctcssTone : ?Text;
    dcsCode : ?Text;
    toneMode : ?Text;
    coverageDescription : ?Text;
    operationalNotes : ?Text;
    autopatchInfo : ?Text;
    linkInfo : ?Text;
    status : ?Status;
  };

  public type UserProfile = {
    name : Text;
    callSign : Text;
    bio : Text;
  };

  module Repeater {
    public func compare(r1 : Repeater, r2 : Repeater) : Order.Order {
      Int.compare(r1.timestamp, r2.timestamp);
    };
  };

  public type FavoriteId = Principal;
  public type Miles = Nat;

  public type ZipCoordinate = {
    latitude : Latitude;
    longitude : Longitude;
  };

  // Sample zip codes with geographic coordinates for the 50 states
  let zipCoordinates : [(ZipCode, ZipCoordinate)] = [
    ("90001", { latitude = 33.9731; longitude = -118.2479 }),
    ("90210", { latitude = 34.0902; longitude = -118.4068 }),
    ("94102", { latitude = 37.7793; longitude = -122.4192 }),
    ("95814", { latitude = 38.5816; longitude = -121.4944 }),
    ("92101", { latitude = 32.7157; longitude = -117.1611 }),
    ("95630", { latitude = 38.6709; longitude = -121.1544 }),
    ("77001", { latitude = 29.8301; longitude = -95.4342 }),
    ("75201", { latitude = 32.7876; longitude = -96.7995 }),
    ("78701", { latitude = 30.2701; longitude = -97.7404 }),
    ("78205", { latitude = 29.4252; longitude = -98.4946 }),
    ("79912", { latitude = 31.8724; longitude = -106.5457 }),
    ("76102", { latitude = 32.7517; longitude = -97.3328 }),
    ("33101", { latitude = 25.7743; longitude = -80.1937 }),
    ("32801", { latitude = 28.5402; longitude = -81.3796 }),
    ("32202", { latitude = 30.3222; longitude = -81.6556 }),
    ("33701", { latitude = 27.7704; longitude = -82.6367 }),
    ("34202", { latitude = 27.4265; longitude = -82.4176 }),
    ("10001", { latitude = 40.7537; longitude = -73.9992 }),
    ("14604", { latitude = 43.1548; longitude = -77.6150 }),
    ("12207", { latitude = 42.6499; longitude = -73.7564 }),
    ("14623", { latitude = 43.0845; longitude = -77.5706 }),
    ("60601", { latitude = 41.8887; longitude = -87.6237 }),
    ("60025", { latitude = 42.0774; longitude = -87.8181 }),
    ("60540", { latitude = 41.7642; longitude = -88.1546 }),
    ("89101", { latitude = 36.1749; longitude = -115.1096 }),
    ("98362", { latitude = 48.1181; longitude = -123.4347 }),
    ("73102", { latitude = 35.4681; longitude = -97.5170 }),
    ("29401", { latitude = 32.7766; longitude = -79.9309 }),
    ("58501", { latitude = 46.8083; longitude = -100.7837 }),
    ("28202", { latitude = 35.2267; longitude = -80.8431 }),
    ("37203", { latitude = 36.1526; longitude = -86.7872 }),
    ("80014", { latitude = 39.6570; longitude = -104.8345 }),
    ("80202", { latitude = 39.7494; longitude = -104.9974 }),
    ("55401", { latitude = 44.9877; longitude = -93.2719 }),
    ("33602", { latitude = 27.9516; longitude = -82.4583 }),
    ("96814", { latitude = 21.2925; longitude = -157.8495 }),
    ("35203", { latitude = 33.5186; longitude = -86.8104 }),
    ("70112", { latitude = 29.9574; longitude = -90.0715 }),
    ("99501", { latitude = 61.2189; longitude = -149.8977 }),
  ];

  // State
  var nextRepeaterId = 2;
  let repeaters = Map.empty<Nat, Repeater>();

  let userProfiles = Map.empty<Principal, UserProfile>();
  let favorites = Map.empty<FavoriteId, Set.Set<RepeaterId>>();

  let hardcodedRepeater : Repeater = {
    id = 1;
    frequency = 146.940;
    offset = -0.6;
    callSign = "K6HOG";
    sponsor = "Hogs Radio Club";
    city = "Los Angeles";
    state = "CA";
    zipCode = "90001";
    ctcssTone = "123.0";
    dcsCode = "N/A";
    toneMode = "FM";
    coverageDescription = "Covers downtown LA and surrounding areas";
    operationalNotes = "Excellent coverage, no known issues";
    autopatchInfo = "No autopatch";
    linkInfo = "Linked to 70cm network";
    status = #active;
    submissionStatus = #approved;
    submittedBy = "Admin";
    timestamp = Time.now();
  };
  repeaters.add(1, hardcodedRepeater);

  // ADMIN SETUP
  public shared ({ caller }) func registerAdmin(passphrase : Text) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot register as admin");
    };
    if (passphrase != "adminPassphrase") {
      Runtime.trap("Invalid admin passphrase");
    };
    switch (adminPrincipal) {
      case (null) { adminPrincipal := ?caller };
      case (?_) { Runtime.trap("Admin already registered") };
    };
  };

  func assertAdminAccess(caller : Principal) {
    switch (adminPrincipal) {
      case (?admin) {
        if (caller != admin) {
          Runtime.trap(
            "Unauthorized: Only admins can perform this action. You must login with your admin Internet Identity (II) credential which requires a security passphrase. If you are not the project owner or in development mode, you must call registerAdmin with the admin secret passphrase from the admin Internet Identity (II) credential."
          );
        };
      };
      case (null) {
        Runtime.trap(
          "No admin registered. Check if the admin has run registerAdmin/(create superuser) first."
        );
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their profile");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func addRepeater(data : NewRepeater) : async Repeater {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add repeaters. Sorry! Double check if you are logged in to HamRepeaters.ai");
    };
    let repeater : Repeater = {
      id = nextRepeaterId;
      frequency = data.frequency;
      offset = data.offset;
      callSign = data.callSign;
      sponsor = data.sponsor;
      city = data.city;
      state = data.state;
      zipCode = data.zipCode;
      ctcssTone = data.ctcssTone;
      dcsCode = data.dcsCode;
      toneMode = data.toneMode;
      coverageDescription = data.coverageDescription;
      operationalNotes = data.operationalNotes;
      autopatchInfo = data.autopatchInfo;
      linkInfo = data.linkInfo;
      status = data.status;
      submissionStatus = #pending;
      submittedBy = data.submittedBy;
      timestamp = Time.now();
    };

    repeaters.add(nextRepeaterId, repeater);
    nextRepeaterId += 1;
    repeater;
  };

  // Admin-only: bulk import repeaters from CSV, immediately approved
  public shared ({ caller }) func bulkAddRepeaters(newRepeaters : [Repeater]) : async () {
    assertAdminAccess(caller);

    for (repeater in newRepeaters.values()) {
      let sanitized : Repeater = {
        id = repeater.id;
        frequency = repeater.frequency;
        offset = repeater.offset;
        callSign = repeater.callSign;
        sponsor = repeater.sponsor;
        city = repeater.city;
        state = repeater.state;
        zipCode = repeater.zipCode;
        ctcssTone = repeater.ctcssTone;
        dcsCode = repeater.dcsCode;
        toneMode = repeater.toneMode;
        coverageDescription = repeater.coverageDescription;
        operationalNotes = repeater.operationalNotes;
        autopatchInfo = repeater.autopatchInfo;
        linkInfo = repeater.linkInfo;
        status = repeater.status;
        submissionStatus = #approved;
        submittedBy = repeater.submittedBy;
        timestamp = repeater.timestamp;
      };
      repeaters.add(sanitized.id, sanitized);
      if (sanitized.id >= nextRepeaterId) {
        nextRepeaterId := sanitized.id + 1;
      };
    };
  };

  public shared ({ caller }) func approveRepeater(repeaterId : Nat, approve : Bool) : async () {
    assertAdminAccess(caller);

    let repeater = switch (repeaters.get(repeaterId)) {
      case (null) { Runtime.trap("Repeater not found") };
      case (?r) { r };
    };

    let updatedRepeater : Repeater = {
      id = repeater.id;
      frequency = repeater.frequency;
      offset = repeater.offset;
      callSign = repeater.callSign;
      sponsor = repeater.sponsor;
      city = repeater.city;
      state = repeater.state;
      zipCode = repeater.zipCode;
      ctcssTone = repeater.ctcssTone;
      dcsCode = repeater.dcsCode;
      toneMode = repeater.toneMode;
      coverageDescription = repeater.coverageDescription;
      operationalNotes = repeater.operationalNotes;
      autopatchInfo = repeater.autopatchInfo;
      linkInfo = repeater.linkInfo;
      status = repeater.status;
      submissionStatus = if approve { #approved } else { #rejected };
      submittedBy = repeater.submittedBy;
      timestamp = repeater.timestamp;
    };

    repeaters.add(repeaterId, updatedRepeater);
  };

  public query func getApprovedRepeaters() : async [Repeater] {
    repeaters.values().toArray().filter(
      func(repeater) {
        repeater.submissionStatus == #approved;
      }
    );
  };

  public query ({ caller }) func getPendingRepeaters() : async [Repeater] {
    assertAdminAccess(caller);
    repeaters.values().toArray().filter(
      func(repeater) {
        repeater.submissionStatus == #pending;
      }
    );
  };

  public shared ({ caller }) func updateRepeater(repeaterId : Nat, data : UpdateRepeaterData) : async Repeater {
    assertAdminAccess(caller);

    let existingRepeater = switch (repeaters.get(repeaterId)) {
      case (null) { Runtime.trap("Repeater not found") };
      case (?r) { r };
    };

    let updatedRepeater : Repeater = {
      id = existingRepeater.id;
      frequency = switch (data.frequency) {
        case (null) { existingRepeater.frequency };
        case (?value) { value };
      };
      offset = switch (data.offset) {
        case (null) { existingRepeater.offset };
        case (?value) { value };
      };
      callSign = switch (data.callSign) {
        case (null) { existingRepeater.callSign };
        case (?value) { value };
      };
      sponsor = switch (data.sponsor) {
        case (null) { existingRepeater.sponsor };
        case (?value) { value };
      };
      city = switch (data.city) {
        case (null) { existingRepeater.city };
        case (?value) { value };
      };
      state = switch (data.state) {
        case (null) { existingRepeater.state };
        case (?value) { value };
      };
      zipCode = switch (data.zipCode) {
        case (null) { existingRepeater.zipCode };
        case (?value) { value };
      };
      ctcssTone = switch (data.ctcssTone) {
        case (null) { existingRepeater.ctcssTone };
        case (?value) { value };
      };
      dcsCode = switch (data.dcsCode) {
        case (null) { existingRepeater.dcsCode };
        case (?value) { value };
      };
      toneMode = switch (data.toneMode) {
        case (null) { existingRepeater.toneMode };
        case (?value) { value };
      };
      coverageDescription = switch (data.coverageDescription) {
        case (null) { existingRepeater.coverageDescription };
        case (?value) { value };
      };
      operationalNotes = switch (data.operationalNotes) {
        case (null) { existingRepeater.operationalNotes };
        case (?value) { value };
      };
      autopatchInfo = switch (data.autopatchInfo) {
        case (null) { existingRepeater.autopatchInfo };
        case (?value) { value };
      };
      linkInfo = switch (data.linkInfo) {
        case (null) { existingRepeater.linkInfo };
        case (?value) { value };
      };
      status = switch (data.status) {
        case (null) { existingRepeater.status };
        case (?value) { value };
      };
      submissionStatus = existingRepeater.submissionStatus;
      submittedBy = existingRepeater.submittedBy;
      timestamp = existingRepeater.timestamp;
    };

    repeaters.add(repeaterId, updatedRepeater);
    updatedRepeater;
  };

  public shared ({ caller }) func deleteRepeater(repeaterId : Nat) : async () {
    assertAdminAccess(caller);

    switch (repeaters.get(repeaterId)) {
      case (null) { Runtime.trap("Repeater not found") };
      case (_) {
        repeaters.remove(repeaterId);
      };
    };
  };

  public query func searchByZipCode(zipCode : Text, radius : Miles) : async [Repeater] {
    if (radius == 0) { return [] };
    let userCoordsOpt = findZipCoords(zipCode);
    let userCoords = switch (userCoordsOpt) {
      case (null) { Runtime.trap("Zip code coordinates not found") };
      case (?coords) { coords };
    };

    let approvedRepeaters = repeaters.values().toArray().filter(
      func(repeater) {
        repeater.submissionStatus == #approved;
      }
    );

    let filteredRepeaters = approvedRepeaters.filter(
      func(repeater) {
        let repeaterCoordsOpt = findZipCoords(repeater.zipCode);
        switch (repeaterCoordsOpt) {
          case (null) { false };
          case (?repeaterCoords) {
            let distance = calculateDistance(userCoords, repeaterCoords);
            distance <= Int.fromNat(radius).toFloat();
          };
        };
      }
    );

    filteredRepeaters;
  };

  func findZipCoords(zipCode : Text) : ?ZipCoordinate {
    switch (zipCoordinates.values().find(func((z, _)) { z == zipCode })) {
      case (null) { null };
      case (?(_, coords)) { ?coords };
    };
  };

  func calculateDistance(coord1 : ZipCoordinate, coord2 : ZipCoordinate) : Float {
    let earthRadius = 3959.0;
    let dLat = deg2rad(coord2.latitude - coord1.latitude);
    let dLon = deg2rad(coord2.longitude - coord1.longitude);

    let lat1 = deg2rad(coord1.latitude);
    let lat2 = deg2rad(coord2.latitude);

    let a = Float.sin(dLat / 2.0) ** 2.0 +
      Float.sin(dLon / 2.0) ** 2.0 *
      Float.cos(lat1) * Float.cos(lat2);

    let c = 2.0 * Float.arctan2(Float.sqrt(a), Float.sqrt(1.0 - a));
    earthRadius * c;
  };

  func deg2rad(deg : Float) : Float {
    deg * Float.pi / 180.0;
  };

  public shared ({ caller }) func addFavorite(repeaterId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add favorites");
    };
    switch (repeaters.get(repeaterId)) {
      case (null) { Runtime.trap("Repeater not found") };
      case (?_) {
        let existingSet = switch (favorites.get(caller)) {
          case (null) {
            let newSet = Set.empty<RepeaterId>();
            favorites.add(caller, newSet);
            newSet;
          };
          case (?set) { set };
        };
        if (existingSet.contains(repeaterId)) {
          Runtime.trap("Repeater already in favorites");
        } else {
          existingSet.add(repeaterId);
        };
      };
    };
  };

  public shared ({ caller }) func removeFavorite(repeaterId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can remove favorites");
    };
    switch (repeaters.get(repeaterId)) {
      case (null) { Runtime.trap("Repeater not found") };
      case (?_) {
        switch (favorites.get(caller)) {
          case (null) { Runtime.trap("No favorites found") };
          case (?favSet) {
            if (favSet.contains(repeaterId)) {
              favSet.remove(repeaterId);
            } else {
              Runtime.trap("Favorite not found");
            };
          };
        };
      };
    };
  };

  // getFavorites: caller must be the user themselves or an admin
  public query ({ caller }) func getFavorites(user : Principal) : async [Repeater] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own favorites");
    };

    let favSet = switch (favorites.get(user)) {
      case (null) { Set.empty<RepeaterId>() };
      case (?set) { set };
    };

    let approvedRepeaters = repeaters.values().toArray().filter(
      func(repeater) {
        repeater.submissionStatus == #approved;
      }
    );
    approvedRepeaters.filter(
      func(repeater) {
        favSet.contains(repeater.id);
      }
    );
  };

  // Public query functions - no auth required
  public query func getApprovedStates() : async [Text] {
    let allStates : [Text] = [
      "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
      "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
      "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
      "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
      "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
    ];
    allStates;
  };

  public query func getApprovedCitiesByState(state : Text) : async [Text] {
    let citiesMap = Map.empty<Text, Bool>();
    for (repeater in repeaters.values()) {
      if (repeater.submissionStatus == #approved and repeater.state == state) {
        citiesMap.add(repeater.city, true);
      };
    };

    citiesMap.keys().toArray().sort();
  };

  public query func getRepeatersByCityAndState(state : Text, city : Text) : async [Repeater] {
    repeaters.values().toArray().filter(
      func(repeater) {
        repeater.submissionStatus == #approved and
        repeater.state == state and
        repeater.city == city
      }
    );
  };

  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func fetchAllRepeaterBookRepeaters() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can fetch repeaters from RepeaterBook");
    };
    let url = "https://api.repeaterbook.com/v1/repeaters";
    await OutCall.httpGetRequest(url, [], transform);
  };

  public shared ({ caller }) func fetchRepeatersByStateFromRepeaterBook(stateAbbreviation : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can fetch repeaters from RepeaterBook");
    };
    let url = "https://api.repeaterbook.com/v1/repeaters?state=" # stateAbbreviation;
    await OutCall.httpGetRequest(url, [], transform);
  };

  public shared ({ caller }) func fetchRepeatersByCountyFromRepeaterBook(stateAbbreviation : Text, county : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can fetch repeaters from RepeaterBook");
    };
    let url = "https://api.repeaterbook.com/v1/repeaters?state=" # stateAbbreviation # "&county=" # replaceSpacesWithPercentTwenty(county);
    await OutCall.httpGetRequest(url, [], transform);
  };

  public shared ({ caller }) func fetchRepeatersByCityFromRepeaterBook(stateAbbreviation : Text, city : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can fetch repeaters from RepeaterBook");
    };
    let url = "https://api.repeaterbook.com/v1/repeaters?state=" # stateAbbreviation # "&city=" # replaceSpacesWithPercentTwenty(city);
    await OutCall.httpGetRequest(url, [], transform);
  };

  public shared ({ caller }) func fetchRepeatersByZipFromRepeaterBook(zipCode : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can fetch repeaters from RepeaterBook");
    };
    let url = "https://api.repeaterbook.com/v1/repeaters?zip=" # zipCode;
    await OutCall.httpGetRequest(url, [], transform);
  };

  public shared ({ caller }) func fetchRepeatersWithinRadiusFromRepeaterBook(zipCode : Text, radius : Nat) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can fetch repeaters from RepeaterBook");
    };
    let url = "https://api.repeaterbook.com/v1/repeaters?zip=" # zipCode # "&radius=" # radius.toText();
    await OutCall.httpGetRequest(url, [], transform);
  };

  func replaceSpacesWithPercentTwenty(text : Text) : Text {
    let textStr = text.toVarArray();
    let resultStr = textStr.map(
      func(c) {
        if (c == ' ') { '%' } else { c };
      }
    );
    let percentTwentyStr = "%20".toVarArray();

    let tempStr = resultStr.concat(percentTwentyStr);
    Text.fromVarArray(tempStr);
  };

  // New function: Bulk add repeaters with passphrase, no principal check
  public shared ({ caller }) func bulkAddRepeatersWithPassphrase(passphrase : Text, newRepeaters : [Repeater]) : async () {
    if (passphrase != "WendellAdmin2024") {
      Runtime.trap("Invalid admin passphrase");
    };

    for (repeater in newRepeaters.values()) {
      let sanitized : Repeater = {
        id = repeater.id;
        frequency = repeater.frequency;
        offset = repeater.offset;
        callSign = repeater.callSign;
        sponsor = repeater.sponsor;
        city = repeater.city;
        state = repeater.state;
        zipCode = repeater.zipCode;
        ctcssTone = repeater.ctcssTone;
        dcsCode = repeater.dcsCode;
        toneMode = repeater.toneMode;
        coverageDescription = repeater.coverageDescription;
        operationalNotes = repeater.operationalNotes;
        autopatchInfo = repeater.autopatchInfo;
        linkInfo = repeater.linkInfo;
        status = repeater.status;
        submissionStatus = #approved;
        submittedBy = repeater.submittedBy;
        timestamp = repeater.timestamp;
      };
      repeaters.add(sanitized.id, sanitized);
      if (sanitized.id >= nextRepeaterId) {
        nextRepeaterId := sanitized.id + 1;
      };
    };
  };

  // New function: Admin passphrase validation, no auth required
  public query func isAdminPassphraseValid(passphrase : Text) : async Bool {
    passphrase == "WendellAdmin2024";
  };
};
