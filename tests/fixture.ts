export const fixture={formatVersion:1,source:"test fixture",exportedAt:"2026-10-17T00:00:00.000Z",tables:{
 brands:[{id:"brand-nox",name:"Nox",slug:"nox"}],
 rackets:[{id:"racket-nox",brand_id:"brand-nox",name:"Nox Test 2025",slug:"nox-test-2025",year:2025,image_url:null,shape:"Round",weight:"365 g",balance:"Medium",surface:"Carbon",core:"EVA",description:null,created_at:"2026-10-01T00:00:00Z"}],
 reviews:[
  {id:"approved-review",racket_id:"racket-nox",rating:4,power_rating:null,control_rating:5,maneuverability_rating:null,comfort_rating:4,forgiveness_rating:null,player_level:"Intermediate",playing_side:"Left",playing_style:null,time_with_racket:null,review_text:"Approved long review. ".repeat(1000).trim(),alias:"Player",email:"private@example.test",status:"approved",tags:["easy power","firm"],created_at:"2026-10-17T00:00:00Z"},
  {id:"pending-review",racket_id:"racket-nox",rating:1,power_rating:null,control_rating:null,maneuverability_rating:null,comfort_rating:null,forgiveness_rating:null,player_level:null,playing_side:null,playing_style:null,time_with_racket:null,review_text:"Pending private review text.",alias:null,email:"pending@example.test",status:"pending",created_at:"2026-10-17T01:00:00Z"}
 ],
 external_reviews:[{id:"external-review",racket_id:"racket-nox",excerpt:"A long external excerpt. ".repeat(1000).trim(),source_platform:"Forum",source_name:"Test forum",source_url:"https://example.com/review",source_date:null,external_rating:null,tags:["good control"],created_at:"2026-10-17T02:00:00Z"}]
}};
