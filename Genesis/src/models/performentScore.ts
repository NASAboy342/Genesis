export class PerformanceScore {
    static Upright: number = 2;
    static GettingCloserToWayPoint: number = 5000;
    static GettingAwayFromWayPoint: number = -5000;
    static NotAboutToCrash: number = 1;
    static AboutToCrash: number = -2;
    static WhenRocketIsStillInTheAirWhileNotCloseToTheWayPoint: number = 2;
    static NotSpinningTooFast: number = 1;
    static SpinningTooFast: number = -2;
    static Crash: number = -10;
    static GettingCloserToWayPointSmoothly: number = 5;
    static GettingCloserToWayPointNotSmoothly: number = 0;
    static RocketIsGoingInLoop: number = 3;
    static FireBothSideThrusterAtTheSameTime: number = -1;
    static FireOnlyOneSideThrusterAtTheSameTime: number = 0.3;
    
}