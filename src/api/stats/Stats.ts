import { Router, Response, Request } from "express";
import { User } from "../users/UserModel";
import moment from "moment";
import mongoose from "mongoose";
import { OrdersModel } from "../orders/OrdersModel";
import {
  sendOKResponse,
  sendErrorResponse,
  sendBadRequestResponse,
} from "../../services/http/Responses";
import { DesignModel } from "../design/DesignModel";
import Auth from "../../services/middlewares/Auth";
const rangePossibleValues = ["week", "year", "month"];
const dataRangePossibleValues = [
  "thisWeek",
  "lastWeek",
  "lastMonth",
  "lastYear",
  "today",
  "lastDay",
  "all",
];
const thisWeek = {
  createdAt: {
    $gte: moment().subtract(8, "days").toDate(),
    $lte: moment().add(1, "days").toDate(),
  },
};
const lastWeek = {
  createdAt: {
    $gte: moment().subtract(2, "week").toDate(),
    $lte: moment().subtract(1, "week").toDate(),
  },
};
const lastMonth = {
  createdAt: {
    $gte: moment().subtract(1, "month").toDate(),
    $lte: moment().add(1, "days").toDate(),
  },
};
const lastYear = {
  createdAt: {
    $gte: moment().subtract(1, "year").toDate(),
    $lte: moment().add(1, "days").toDate(),
  },
};
const today = {
  createdAt: {
    $gte: moment().subtract(1, "days").toDate(),
  },
};
const lastDay = {
  createdAt: {
    $gte: moment().subtract(2, "days").toDate(),
  },
};

const statsRouter = Router();
statsRouter.get("/admin-stats", async (req: Request, res: Response) => {
  const { range = "month", dataRange = "all" } = req.query;
  if (
    !rangePossibleValues.includes(range) ||
    !dataRangePossibleValues.includes(dataRange)
  ) {
    return sendErrorResponse(res, new Error("invalid range possible value"));
  }
  const groupByRange = range
    ? range === "month"
      ? { $month: "$createdAt" }
      : range === "year"
      ? { $year: "$createdAt" }
      : { $week: "$createdAt" }
    : { $month: "$createdAt" };

  const revenuProject: {
    $project: {
      _id: number;
      gain: number;
      month?: string;
      year?: string;
      week?: string;
    };
  } = {
    $project: {
      _id: 0,
      gain: 1,
    },
  };
  revenuProject["$project"][
    range
      ? range === "month"
        ? "month"
        : range === "year"
        ? "year"
        : "week"
      : "month"
  ] = "$_id";

  const [
    user24Count,
    ordersReady,
    ordersOnHold,
    artistNewCounts,
  ] = await Promise.all([
    User.countDocuments({ createdAt: moment().subtract(1, "day") }),
    OrdersModel.countDocuments({ state: "ready" }),
    OrdersModel.countDocuments({ state: "onhold" }),
    User.countDocuments({ isArtist: true, active: false }),
  ]);
  let matchRange: { createdAt?: { $gte: Date } } = {};
  switch (dataRange) {
    case "today":
      matchRange = today;
      break;
    case "lastYear":
      matchRange = lastYear;
      break;
    case "lastMonth":
      matchRange = lastMonth;
      break;
    case "lastWeek":
      matchRange = lastWeek;
      break;
    case "thisWeek":
      matchRange = thisWeek;
      break;
    case "lastDay":
      matchRange = lastDay;
      break;
    default:
      break;
  }
  const aggregatePipe: any[] = [
    {
      $group: {
        _id: null,
        gain: { $sum: "$subTotalPrice" },
      },
    },
    {
      $project: {
        _id: 0,
        gain: 1,
      },
    },
  ];
  // if (dataRange !== "all") {
  //   aggregatePipe.unshift({
  //     $match: matchRange,
  //   });
  // }
  const [
    toDayGain,
    lastMonthGain,
    fromStartGain,
    nbTodayArtists,
    nbLastMonthArtists,
    nbArtists,
    nbTodayDesigns,
    nbLastMonthDesigns,
    nbDesigns,
  ] = await Promise.all([
    OrdersModel.aggregate([
      {
        $match: today,
      },
      ...aggregatePipe,
    ]),
    OrdersModel.aggregate([
      {
        $match: lastMonth,
      },
      ...aggregatePipe,
    ]),
    OrdersModel.aggregate(aggregatePipe),
    User.countDocuments({
      isArtist: true,
      ...today,
    }),
    User.countDocuments({
      isArtist: true,
      ...lastMonth,
    }),
    User.countDocuments({
      isArtist: true,
    }),
    DesignModel.countDocuments(today),
    DesignModel.countDocuments(lastMonth),
    DesignModel.countDocuments(matchRange),
  ]);

  const [
    highestDemands,
    recentOrders,
    orderByCategory,
    ordersByArtist,
    nbOrdersByMonth,
    revenuByRange,
  ] = await Promise.all([
    DesignModel.aggregate([
      {
        $addFields: {
          gain: {
            $multiply: ["$totalPrice", "$numberOfOrders"],
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          numberOfOrders: 1,
          gain: 1,
        },
      },
      { $sort: { numberOfOrders: -1 } },
    ]),
    OrdersModel.find()
      .populate("ownerId", "_id name")
      .populate("designs.designRef", "_id name")
      .select({ subTotalPrice: 1, totalPrice: 1, ownerId: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(8),
    OrdersModel.aggregate([
      {
        $lookup: {
          from: "designs",
          localField: "designs.designRef",
          foreignField: "_id",
          as: "designs",
        },
      },
      {
        $unwind: "$designs",
      },
      {
        $project: {
          _id: 1,
          designs: {
            categories: 1,
          },
        },
      },
      {
        $unwind: "$designs.categories",
      },
      {
        $group: {
          _id: "$designs.categories",
          numberOfOrders: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "cateogory",
        },
      },
      {
        $project: {
          _id: 1,
          numberOfOrders: 1,
          cateogory: {
            _id: 1,
            name: 1,
          },
        },
      },
    ]),
    OrdersModel.aggregate([
      {
        $lookup: {
          from: "designs",
          localField: "designs.designRef",
          foreignField: "_id",
          as: "designs",
        },
      },
      {
        $unwind: "$designs",
      },
      {
        $group: {
          _id: "$designs.artistId",
          total: { $sum: "$designs.totalPrice" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "users",
        },
      },
      {
        $project: {
          _id: 1,
          total: 1,
          user: { $arrayElemAt: ["$users", 0] },
        },
      },
      {
        $project: {
          _id: 1,
          total: 1,
          user: {
            _id: 1,
            name: 1,
          },
        },
      },
    ]),
    OrdersModel.aggregate([
      {
        $group: {
          _id: groupByRange,
          numberOfOrders: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id",
          numberOfOrders: 1,
        },
      },
    ]),
    OrdersModel.aggregate([
      {
        $group: {
          _id: groupByRange,
          gain: { $sum: "$subTotalPrice" },
        },
      },
      revenuProject,
    ]),
  ]);
  sendOKResponse(res, {
    mainInfo: {
      today: {
        gain: toDayGain,
        nbArtists: nbTodayArtists,
        nbDesigns: nbTodayDesigns,
      },
      lastMonth: {
        gain: lastMonthGain,
        nbArtists: nbLastMonthArtists,
        nbDesigns: nbLastMonthDesigns,
      },
      fromStart: {
        gain: fromStartGain,
        nbArtists,
        nbDesigns,
      },
    },
    details: {
      user24Count,
      ordersReady,
      ordersOnHold,
      artistNewCounts,
    },
    highestDemands,
    recentOrders,
    orderByCategory,
    ordersByArtist,
    nbOrdersByMonth,
    revenuByRange,
  });
});
statsRouter.get("/artist-stats", [Auth], async (req: any, res: Response) => {
  try {
    const { id: artistId } = req.user;
    const user = await User.findById({ _id: artistId }).select("designs");
    if (!user) {
      return sendBadRequestResponse(res, "Can't find this artist");
    }
    const [
      gainByDate,
      numberOfOrdersByDate,
      recentOrders,
      nbOrdersbyDesign,
    ] = await Promise.all([
      OrdersModel.aggregate([
        {
          $unwind: "$designs",
        },
        {
          $addFields: {
            quantity: "$designs.quantity",
          },
        },
        {
          $lookup: {
            from: "designs",
            localField: "designs.designRef",
            foreignField: "_id",
            as: "designs",
          },
        },
        {
          $addFields: {
            subTotal: "$designs.totalPrice",
          },
        },
        {
          $project: {
            _id: 1,
            quantity: 1,
            subTotal: 1,
            createdAt: 1,
            sum: {
              $multiply: ["$quantity", { $arrayElemAt: ["$subTotal", 0] }],
            },
            designs: {
              _id: 1,
              artistId: 1,
            },
          },
        },
        {
          $match: { "designs.artistId": new mongoose.Types.ObjectId(artistId) },
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            total: { $sum: "$sum" },
          },
        },
        {
          $project: {
            _id: 0,
            month: "$_id",
            total: 1,
          },
        },
      ]),
      OrdersModel.aggregate([
        {
          $unwind: "$designs",
        },
        {
          $addFields: {
            quantity: "$designs.quantity",
          },
        },
        {
          $lookup: {
            from: "designs",
            localField: "designs.designRef",
            foreignField: "_id",
            as: "designs",
          },
        },
        {
          $project: {
            _id: 1,
            createdAt: 1,
            quantity: 1,
            designs: {
              _id: 1,
              artistId: 1,
            },
          },
        },
        {
          $match: { "designs.artistId": new mongoose.Types.ObjectId(artistId) },
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            totalNumberOfOrders: { $sum: "$quantity" },
          },
        },
        {
          $project: {
            _id: 0,
            month: "$_id",
            totalNumberOfOrders: 1,
          },
        },
      ]),
      OrdersModel.find({
        "designs.designRef": { $in: [...user.designs] },
      })
        .populate("ownerId", "_id name")
        .limit(6),
      OrdersModel.aggregate([
        {
          $unwind: "$designs",
        },
        {
          $addFields: {
            quantity: "$designs.quantity",
          },
        },
        {
          $lookup: {
            from: "designs",
            localField: "designs.designRef",
            foreignField: "_id",
            as: "designs",
          },
        },
        {
          $addFields: {
            subTotal: "$designs.totalPrice",
          },
        },
        {
          $project: {
            _id: 1,
            quantity: 1,
            subTotal: 1,
            createdAt: 1,
            sum: {
              $multiply: ["$quantity", { $arrayElemAt: ["$subTotal", 0] }],
            },
            designs: {
              _id: 1,
              name: 1,
              artistId: 1,
            },
          },
        },
        {
          $match: { "designs.artistId": new mongoose.Types.ObjectId(artistId) },
        },
      ]),
    ]);
    sendOKResponse(res, {
      gainByDate,
      numberOfOrdersByDate,
      recentOrders,
      nbOrdersbyDesign,
    });
  } catch (error) {
    sendErrorResponse(res, error);
  }
});
export default statsRouter;
