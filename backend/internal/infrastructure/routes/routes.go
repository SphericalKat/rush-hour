// Package routes provides the physical station ordering for Mumbai suburban
// lines, matching the hardcoded sequences in the m-indicator app (bb.a).
// These are stable since the physical track layout doesn't change.
package routes

// Each slice is one contiguous segment of track in the down direction.
var segments = [][]string{
	// Western Line: Churchgate → Dahanu Road
	{"CHURCHGATE", "MARINE LINES", "CHARNI ROAD", "GRANT ROAD", "MUMBAI CENTRAL", "MAHALAKSHMI", "LOWER PAREL", "PRABHADEVI", "DADAR", "MATUNGA ROAD", "MAHIM JN", "BANDRA", "KHAR ROAD", "SANTA CRUZ", "VILE PARLE", "ANDHERI", "JOGESHWARI", "RAM MANDIR", "GOREGAON", "MALAD", "KANDIVALI", "BORIVALI", "DAHISAR", "MIRA ROAD", "BHAYANDAR", "NAIGAON", "VASAI ROAD", "NALLA SOPARA", "VIRAR", "VAITARANA", "SAPHALE", "KELVA ROAD", "PALGHAR", "UMROLI ROAD", "BOISAR", "VANGAON", "DAHANU ROAD"},
	// Central Line main: CSMT → Kalyan
	{"CSMT", "MASJID", "SANDHURST ROAD", "BYCULLA", "CHINCHPOKLI", "CURREY ROAD", "PAREL", "DADAR", "MATUNGA", "SION", "KURLA", "VIDYAVIHAR", "GHATKOPAR", "VIKHROLI", "KANJUR MARG", "BHANDUP", "NAHUR", "MULUND", "THANE", "KALVA", "MUMBRA", "DIVA JN", "KOPAR", "DOMBIVLI", "THAKURLI", "KALYAN"},
	// Central Line Karjat branch: Kalyan → Khopoli
	{"KALYAN", "VITHALWADI", "ULHAS NAGAR", "AMBARNATH", "BADLAPUR", "VANGANI", "SHELU", "NERAL", "BHIVPURI ROAD", "KARJAT", "PALASDHARI", "KELAVLI", "DOLAVLI", "LOWJEE", "KHOPOLI"},
	// Central Line Kasara branch: Kalyan → Kasara
	{"KALYAN", "SHAHAD", "AMBIVLI", "TITWALA", "KHADAVLI", "VASIND", "ASANGAON", "ATGAON", "THANSIT", "KHARDI", "UMBERMALI", "KASARA"},
	// Harbour Line: CSMT → Panvel
	{"CSMT", "MASJID", "SANDHURST ROAD", "DOCKYARD ROAD", "REAY ROAD", "COTTON GREEN", "SEWRI", "VADALA ROAD", "GTB NAGAR", "CHUNABHATTI", "KURLA", "TILAKNAGAR", "CHEMBUR", "GOVANDI", "MANKHURD", "VASHI", "SANPADA", "JUINAGAR", "NERUL", "SEAWOOD DARAVE KARAVE", "BELAPUR CBD", "KHARGHAR", "MANASAROVAR", "KHANDESHWAR", "PANVEL"},
	// Harbour Line Goregaon extension
	{"VADALA ROAD", "KINGS CIRCLE", "MAHIM JN", "BANDRA", "KHAR ROAD", "SANTA CRUZ", "VILE PARLE", "ANDHERI", "JOGESHWARI", "RAM MANDIR", "GOREGAON"},
	// Trans-Harbour: Thane → Nerul
	{"THANE", "AIROLI", "RABALE", "GHANSOLI", "KOPARKHAIRNE", "TURBHE", "JUINAGAR", "NERUL"},
	// Trans-Harbour: Thane → Vashi
	{"THANE", "AIROLI", "RABALE", "GHANSOLI", "KOPARKHAIRNE", "TURBHE", "SANPADA", "VASHI"},
	// Uran Line (reversed in source, stored down direction)
	{"ROHA", "NIDI", "NAGOTHANE", "KASU", "PEN", "HAMARAPUR", "JITE", "APTA", "RASAYANI", "SOMTANE", "PANVEL", "KALAMBOLI", "NAVADE ROAD", "TALOJA PANCHANAND", "NILJE", "DATIVALI", "DIVA JN"},
	// Port Line: Vasai Road → Panvel via Diva
	{"VASAI ROAD", "JUCHANDRA ROAD", "KAMAN ROAD", "KHARBAO", "BHIWANDI ROAD", "KOPAR", "DIVA JN", "DOMBIVLI", "DATIVALI", "NILJE", "TALOJA PANCHANAND", "NAVADE ROAD", "KALAMBOLI", "PANVEL"},
	// Uran branch from Nerul
	{"NERUL", "SEAWOOD DARAVE KARAVE", "TARGHAR", "BAMANDONGRI", "KHARKOPAR", "GAVHAN", "SHEMATIKHAR", "NAVA SHEVA", "DRONAGIRI", "URAN"},
	// Uran branch from Belapur
	{"BELAPUR CBD", "TARGHAR", "BAMANDONGRI", "KHARKOPAR", "GAVHAN", "SHEMATIKHAR", "NAVA SHEVA", "DRONAGIRI", "URAN"},
}

// StationsBetween returns the intermediate stations between from and to,
// exclusive of both endpoints. Returns nil if no matching segment is found.
// This mirrors m-indicator's bb.a.b() method.
func StationsBetween(from, to string) []string {
	for _, seg := range segments {
		fromIdx := -1
		toIdx := -1
		for i, name := range seg {
			if name == from {
				if toIdx >= 0 {
					// to was found first, stations are in reverse order
					return reversed(seg[toIdx+1 : i])
				}
				fromIdx = i
			} else if name == to {
				if fromIdx >= 0 {
					// from was found first, stations are in forward order
					return cloneSlice(seg[fromIdx+1 : i])
				}
				toIdx = i
			}
		}
	}
	return nil
}

func reversed(s []string) []string {
	out := make([]string, len(s))
	for i, v := range s {
		out[len(s)-1-i] = v
	}
	return out
}

func cloneSlice(s []string) []string {
	out := make([]string, len(s))
	copy(out, s)
	return out
}
