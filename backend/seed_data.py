"""Seed data for initial products and reviews."""
from models import Product, Review


def get_seed_products():
    return [
        Product(name="Klassisk Fotomugg", category="mugg", description="En vacker keramikmugg med ditt eget foto. Perfekt för morgonkaffet eller som personlig present.", price=149.0, images=["https://images.unsplash.com/photo-1627807461786-081fc0e1215c?w=600"], colors=["Vit", "Svart", "Beige"], model_type="mug"),
        Product(name="Premium Fotomugg", category="mugg", description="Extra stor mugg med hög bildkvalitet. Tål diskmaskin.", price=199.0, images=["https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600"], colors=["Vit", "Grå"], model_type="mug"),
        Product(name="T-shirt med Eget Tryck", category="tshirt", description="100% bomull t-shirt med ditt personliga motiv. Hög kvalité och hållbar tryckteknik.", price=249.0, images=["https://images.unsplash.com/photo-1593733926335-bdec7f12acfd?w=600"], colors=["Vit", "Svart", "Grå", "Marinblå"], sizes=["XS", "S", "M", "L", "XL", "XXL"], model_type="tshirt"),
        Product(name="Premium T-shirt", category="tshirt", description="Ekologisk bomull med premiumtryck. Extra mjukt tyg.", price=349.0, images=["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600"], colors=["Vit", "Svart", "Beige"], sizes=["S", "M", "L", "XL"], model_type="tshirt"),
        Product(name="Hoodie med Foto", category="hoodie", description="Mysig hoodie med eget motiv. Perfekt för svalare dagar.", price=449.0, images=["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600"], colors=["Svart", "Grå", "Marinblå"], sizes=["S", "M", "L", "XL", "XXL"], model_type="hoodie"),
        Product(name="Fotocanvas Poster", category="poster", description="Canvas print av hög kvalité. Redo att hänga på väggen.", price=299.0, images=["https://images.unsplash.com/photo-1571164860029-856acbc24b4a?w=600"], sizes=["30x40cm", "50x70cm", "70x100cm"], model_type="poster"),
        Product(name="Premium Poster", category="poster", description="Konsttryck på premium fotopapper. Museestandard.", price=399.0, images=["https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=600"], sizes=["A3", "A2", "A1"], model_type="poster"),
        Product(name="iPhone Skal", category="mobilskal", description="Skyddande mobilskal med ditt eget foto. Passar de senaste iPhone-modellerna.", price=199.0, images=["https://static.prod-images.emergentagent.com/jobs/cd68a842-19ed-45bc-a36c-2389ae41c63e/images/85a45f02a7e9178632d56b673ee19b1c5ee40cbb0d3c4c37dd4c5ea35eaaf2e4.png"], colors=["Transparent", "Svart"], sizes=["iPhone 14", "iPhone 15", "iPhone 16"], model_type="phonecase"),
        Product(name="Ekologisk Tygkasse", category="tygkasse", description="Miljövänlig tygkasse med ditt personliga motiv. Perfekt för shopping.", price=129.0, images=["https://images.unsplash.com/photo-1597633244018-0201d0158aec?w=600"], colors=["Naturvit", "Svart"], model_type="totebag"),
        Product(name="Årskalender med Foton", category="kalender", description="Personlig väggkalender med dina egna bilder. 12 månader, en bild per månad. A3-format.", price=249.0, images=["https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600"], sizes=["A3", "A4"], model_type="calendar"),
        Product(name="Skrivbordskalender", category="kalender", description="Kompakt skrivbordskalender med spiralbindning. Perfekt present eller för kontoret.", price=179.0, images=["https://images.unsplash.com/photo-1435527173128-983b87201f4d?w=600"], sizes=["Standard"], model_type="calendar"),
        Product(name="Familjekalender", category="kalender", description="Stor familjekalender med plats för anteckningar. Perfekt för att planera familjens aktiviteter.", price=299.0, images=["https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600"], sizes=["A2", "A3"], model_type="calendar"),
        Product(name="Strykmärken med Namn", category="namnskylt", description="Personliga strykmärken för barnskläder. Perfekt för förskolan! 30 st i paketet. Tål tvätt i 60°C.", price=149.0, images=["https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600"], colors=["Vit", "Rosa", "Ljusblå", "Grön", "Gul"], sizes=["Liten (2x5cm)", "Mellan (2.5x6cm)", "Stor (3x7cm)"], model_type="nametag"),
        Product(name="Symärken med Namn", category="namnskylt", description="Sybara namnlappar i mjukt tyg. Perfekt för ömtåliga plagg. 25 st i paketet.", price=129.0, images=["https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600"], colors=["Vit", "Beige", "Rosa", "Ljusblå"], sizes=["Standard (2x6cm)"], model_type="nametag"),
        Product(name="Namnstämpel för Kläder", category="namnskylt", description="Självfärgande stämpel för att märka kläder, väskor och lunchboxar. Tål tvätt upp till 90°C!", price=199.0, images=["https://images.unsplash.com/photo-1584727638096-042c45049ebe?w=600"], model_type="nametag"),
        Product(name="Namnlappar med Figur", category="namnskylt", description="Strykmärken med söta figurer (djur, fordon, blommor) + barnets namn. 30 st i paketet.", price=179.0, images=["https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600"], colors=["Vit bakgrund", "Färgglad bakgrund"], sizes=["Liten (2x5cm)", "Mellan (2.5x6cm)"], model_type="nametag"),
        # B2B Products
        Product(product_id="print-businesscard", name="Visitkort", category="foretag", description="Designa eller ladda upp egna visitkort. Professionell tryckkvalitet.", price=89.0, images=["https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600"], model_type="businesscard"),
        Product(product_id="print-catalog", name="Katalogutskrift", category="foretag", description="Ladda upp din PDF-katalog och vi trycker den i professionell kvalitet.", price=149.0, images=["https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600"], model_type="catalog_print"),
        Product(product_id="print-catalog-custom", name="Egen Katalogdesign", category="foretag", description="Designa din egen produktkatalog med vår editor. Välj mall, lägg till produkter och vi trycker.", price=199.0, images=["https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600"], model_type="catalog_design"),
    ]


def get_seed_reviews():
    return [
        Review(user_name="Anna S.", rating=5, text="Fantastisk kvalité på muggen! Min mormor älskade presenten. Kommer definitivt beställa fler."),
        Review(user_name="Erik M.", rating=5, text="Supersmidig process från uppladdning till leverans. T-shirten ser precis ut som förhandsgranskningen."),
        Review(user_name="Lisa K.", rating=4, text="Jättebra tygkasse! Perfekt julklapp. Lite längre leveranstid än förväntat men värt väntan."),
        Review(user_name="Johan P.", rating=5, text="Designverktyget är så enkelt att använda. Gjorde en hoodie till min son - han blev jätteglad!"),
        Review(user_name="Maria L.", rating=5, text="Canvas-postern blev verkligen fin! Hög kvalité och snabb leverans. Rekommenderas!"),
    ]
