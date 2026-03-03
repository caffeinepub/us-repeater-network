import Map "mo:core/Map";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Time "mo:core/Time";

module {
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
    status : {
      #active;
      #inactive;
    };
    submissionStatus : {
      #pending;
      #approved;
      #rejected;
    };
    submittedBy : Text;
    timestamp : Time.Time;
  };

  type OldUserProfile = {
    name : Text;
    callSign : Text;
    bio : Text;
  };

  type OldActor = {
    adminPrincipal : ?Principal;
    nextRepeaterId : Nat;
    repeaters : Map.Map<Nat, OldRepeater>;
    userProfiles : Map.Map<Principal, OldUserProfile>;
    favorites : Map.Map<Principal, Set.Set<Nat>>;
  };

  type NewActor = {
    adminPrincipal : ?Principal;
    nextRepeaterId : Nat;
    repeaters : Map.Map<Nat, OldRepeater>;
    userProfiles : Map.Map<Principal, OldUserProfile>;
    favorites : Map.Map<Principal, Set.Set<Nat>>;
  };

  public func run(old : OldActor) : NewActor {
    {
      adminPrincipal = old.adminPrincipal;
      nextRepeaterId = old.nextRepeaterId;
      repeaters = old.repeaters;
      userProfiles = old.userProfiles;
      favorites = old.favorites;
    };
  };
};
