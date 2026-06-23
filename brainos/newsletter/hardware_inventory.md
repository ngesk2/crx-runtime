# LAYER 0: HARDWARE INVENTORY

## Host Machine Information

**Hostname:** PIG  
**Model:** Dell Precision 7670  
**Manufacturer:** Dell Inc.  
**Owner:** nolangesk@gmail.com  
**Domain:** WORKGROUP  
**Total Physical Memory:** 63.7 GB (68,388,900,864 bytes)

---

## CPU

**Processor:** 12th Gen Intel(R) Core(TM) i7-12850HX  
**Architecture:** Intel64 Family 6 Model 151 Stepping 2  
**Physical Cores:** 16  
**Logical Threads:** 24  
**Max Clock Speed:** 2,100 MHz (2.1 GHz)  
**Socket:** U3E1  

---

## RAM

**Total Capacity:** 64 GB (68,719,476,736 bytes)  
**Configuration:** Single DIMM  
**Speed:** 4,800 MT/s (DDR5)  
**Manufacturer:** 8CFD000080AD  
**Part Number:** K467XP-HYM-I  
**Serial Number:** 000479B3  
**Location:** DIMM A  
**Form Factor:** SODIMM  
**Voltage:** 1.1V  

---

## GPU

### GPU 1: Intel(R) UHD Graphics
**Status:** Active (Primary Display)  
**Adapter RAM:** 2.0 GB (2,147,479,552 bytes)  
**Driver Version:** 32.0.101.7084  
**Driver Date:** January 14, 2026  
**Current Resolution:** 1920 x 1200 @ 60Hz  
**Color Depth:** 32 bits per pixel  

### GPU 2: NVIDIA RTX A2000 8GB Laptop GPU
**Status:** OK (Secondary/Compute)  
**Adapter RAM:** 4.0 GB (4,293,918,720 bytes)  
**Driver Version:** 32.0.15.8195  
**Driver Date:** November 17, 2025  
**Architecture:** NVIDIA Ampere  

---

## Disk Devices

### Physical Drive 0
**Device ID:** \\.\PHYSICALDRIVE0  
**Model:** PM9A1 NVMe Samsung 512GB  
**Type:** NVMe SSD  
**Total Capacity:** 477 GB (512,105,932,800 bytes)  
**Partitions:** 5  

### Logical Disks

#### C: Drive (OS)
**Volume Name:** OS  
**File System:** NTFS  
**Total Size:** 462 GB (496,069,767,168 bytes)  
**Free Space:** 145 GB (155,669,372,928 bytes)  
**Used Space:** 317 GB (68.6% used)  
**Health Status:** Healthy  
**Operational Status:** OK  

#### Recovery Partitions
**WINRETOOLS:** 1.09 GB (151.45 MB free) - NTFS  
**Image:** 11.81 GB (2.96 GB free) - NTFS  
**DELLSUPPORT:** 1.41 GB (353.34 MB free) - NTFS  

---

## Network Interfaces

### Active Interfaces

#### vEthernet (Default Switch)
**Status:** Up  
**Interface:** Hyper-V Virtual Ethernet Adapter  
**MAC Address:** 00-15-5D-01-1F-00  
**Link Speed:** 10 Gbps  
**Index:** 33  

#### vEthernet (WSL)
**Status:** Up  
**Interface:** Hyper-V Virtual Ethernet Adapter #2  
**MAC Address:** 00-15-5D-76-CA-02  
**Link Speed:** 10 Gbps  
**Index:** 50  
**Purpose:** Windows Subsystem for Linux  

#### Wi-Fi
**Status:** Up  
**Interface:** Intel(R) Wi-Fi 6E AX211 160MHz  
**MAC Address:** 64-49-7D-00-37-BE  
**Link Speed:** 866.7 Mbps  
**Index:** 2  

### Inactive Interfaces

#### Ethernet
**Status:** Disconnected  
**Interface:** Intel(R) Ethernet Connection (17) I219-LM  
**MAC Address:** AC-91-A1-31-04-85  
**Link Speed:** 0 bps  
**Index:** 12  

#### Bluetooth Network Connection
**Status:** Disconnected  
**Interface:** Bluetooth Device (Personal Area Network)  
**MAC Address:** 64-49-7D-00-37-C2  
**Link Speed:** 3 Mbps  
**Index:** 19  

---

## Summary

**Physical Resources Exist:**
- 16-core / 24-thread Intel i7-12850HX CPU @ 2.1 GHz
- 64 GB DDR5 RAM @ 4800 MT/s
- Dual GPU: Intel UHD Graphics (2GB) + NVIDIA RTX A2000 (4GB)
- 512 GB NVMe SSD (477 GB usable, 317 GB used)
- 5 Network interfaces (3 active: 2x Hyper-V virtual, 1x Wi-Fi 6E)
- Dell Precision 7670 mobile workstation

**Answer:** What physical resources exist?
- A high-performance mobile workstation with 16-core CPU, 64GB RAM, dual GPU configuration, 512GB NVMe storage, and multiple network interfaces including virtual adapters for containerization (Hyper-V/WSL) and wireless connectivity.
