cmake_minimum_required(VERSION 3.15)

project(Totala)

include(FetchContent)

set(CXXOPTS_BUILD_EXAMPLES OFF CACHE INTERNAL "")
set(CXXOPTS_BUILD_TESTS OFF CACHE INTERNAL "")

FetchContent_Declare(
  cxxopts
  GIT_REPOSITORY https://github.com/jarro2783/cxxopts.git
  GIT_TAG        v2.2.1
)

FetchContent_Declare(
  zlib
  GIT_REPOSITORY https://github.com/madler/zlib.git
  GIT_TAG        v1.2.11
  QUIET
)

FetchContent_MakeAvailable(zlib cxxopts)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED YES)
set(CMAKE_CXX_EXTENSIONS NO)

add_executable(ta
  src/main.cpp
  src/hpi.cpp
  src/3do.cpp
  src/file.cpp
  src/cob.cpp
)

set_target_properties(ta
  PROPERTIES
    CXX_STANDARD 20
    CXX_STANDARD_REQUIRED YES
    CXX_EXTENSIONS NO
)

target_include_directories(ta
  PRIVATE
    ${zlib_BINARY_DIR}
    ${zlib_SOURCE_DIR}
)

target_link_libraries(ta
  cxxopts
  zlibstatic
)
