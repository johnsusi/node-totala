cmake_minimum_required(VERSION 3.15)

project(Totala)

include(FetchContent)

# FetchContent_Declare(
#   docopt
#   GIT_REPOSITORY https://github.com/docopt/docopt.cpp.git
#   GIT_TAG        v0.6.3
# )

set(CXXOPTS_BUILD_EXAMPLES OFF CACHE INTERNAL "")
set(CXXOPTS_BUILD_TESTS OFF CACHE INTERNAL "")
# set(CXXOPTS_ENABLE_INSTALL OFF CACHE INTERNAL "")

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

add_executable(ta-hpi
  src/hpi-main.cpp
  src/hpi.cpp
  src/file.cpp
)

# set_target_properties(ta-hpi PROPERTIES
#   CXX_STANDARD 20
#   CXX_STANDARD_REQUIRED YES
#   CXX_EXTENSIONS NO
# )

target_include_directories(ta-hpi
  PRIVATE
  ${zlib_BINARY_DIR}
  ${zlib_SOURCE_DIR}
)

target_link_libraries(ta-hpi
  cxxopts
  zlibstatic
)

add_executable(ta-3do
  src/3do-main.cpp
  src/3do.cpp
  src/file.cpp
)

# set_target_properties(ta-3do PROPERTIES
#   CXX_STANDARD 20
#   CXX_STANDARD_REQUIRED YES
#   CXX_EXTENSIONS NO
# )


add_executable(ta-cob
  src/cob-main.cpp
  src/file.cpp
)

target_link_libraries(ta-cob
  cxxopts
)
# set_target_properties(ta-3do PROPERTIES
#   CXX_STANDARD 20
#   CXX_STANDARD_REQUIRED YES
#   CXX_EXTENSIONS NO
# )

