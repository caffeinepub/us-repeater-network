import Map "mo:core/Map";
import Set "mo:core/Set";

module {
  // Old types defined inline (copied from .old/src/backend/dist/backend.most)
  type OldUserRole = { #admin; #guest; #user };
  type OldAccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, OldUserRole>;
  };

  type OldStatus = { #active; #inactive };
  type OldSubmissionStatus = { #approved; #pending; #rejected };
  type OldRepeater = {
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
    status : OldStatus;
    submissionStatus : OldSubmissionStatus;
    submittedBy : Text;
    timestamp : Int;
  };
  type OldUserProfile = { bio : Text; callSign : Text; name : Text };
  type OldFavoriteId = Principal;
  type OldRepeaterId = Nat;
  type OldZipCode = Text;
  type OldZipCoordinate = { latitude : Float; longitude : Float };

  type OldActor = {
    accessControlState : OldAccessControlState;
    var adminPrincipal : ?Principal;
    favorites : Map.Map<OldFavoriteId, Set.Set<OldRepeaterId>>;
    var nextRepeaterId : Nat;
    repeaters : Map.Map<Nat, OldRepeater>;
    userProfiles : Map.Map<Principal, OldUserProfile>;
  };

  type NewStatus = { #active; #inactive };
  type NewSubmissionStatus = { #approved; #pending; #rejected };
  type NewRepeater = {
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
    status : NewStatus;
    submissionStatus : NewSubmissionStatus;
    submittedBy : Text;
    timestamp : Int;
  };
  type NewUserProfile = { bio : Text; callSign : Text; name : Text };

  type NewActor = {
    var adminPrincipal : ?Principal;
    favorites : Map.Map<Principal, Set.Set<Nat>>;
    var nextRepeaterId : Nat;
    repeaters : Map.Map<Nat, NewRepeater>;
    userProfiles : Map.Map<Principal, NewUserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    // accessControlState is explicitly consumed and discarded (removed in new version)
    {
      var adminPrincipal = old.adminPrincipal;
      favorites = old.favorites;
      var nextRepeaterId = old.nextRepeaterId;
      repeaters = old.repeaters;
      userProfiles = old.userProfiles;
    };
  };
};
